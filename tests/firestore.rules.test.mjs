import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const projectId = 'demo-maximpress-rules';
let env;

const verified = (uid, email, extra = {}) =>
  env.authenticatedContext(uid, { email, email_verified: true, ...extra }).firestore();

const profile = (uid, email) => ({
  customerId: uid,
  fullName: 'Test Customer',
  email,
  photoURL: '',
  provider: 'password',
  linkedProviders: ['password'],
  createdAt: serverTimestamp(),
  lastLoginAt: serverTimestamp(),
  category: '',
  goal: '',
  referral: '',
  socialProfile: '',
  onboardingComplete: false,
});

const order = uid => ({
  customerId: uid,
  service: 'Instagram Management',
  notes: 'Please review my account.',
  status: 'pending',
  paymentStatus: 'unconfirmed',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});

beforeEach(async () => env.clearFirestore());
after(async () => { if (env) await env.cleanup(); });

test('signed-in unverified customers bootstrap only their own private profile', async () => {
  const db = env.authenticatedContext('alice', {
    email: 'alice@example.com',
    email_verified: false,
  }).firestore();
  await assertSucceeds(setDoc(doc(db, 'customers', 'alice'), profile('alice', 'alice@example.com')));
  await assertSucceeds(getDoc(doc(db, 'customers', 'alice')));
  await assertFails(setDoc(doc(db, 'customers', 'bob'), profile('bob', 'alice@example.com')));
  await assertFails(getDoc(doc(db, 'customers', 'bob')));
  await assertFails(setDoc(doc(db, 'orders', 'unverified-order'), order('alice')));
  await assertFails(setDoc(doc(db, 'reviewVotes', 'r01', 'votes', 'alice'), {
    value: 1,
    updatedAt: serverTimestamp(),
  }));
});

test('anonymous visitors cannot create or read customer profiles', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(setDoc(doc(db, 'customers', 'alice'), profile('alice', 'alice@example.com')));
  await assertFails(getDoc(doc(db, 'customers', 'alice')));
});

test('verified customers create only their own initial profile', async () => {
  const db = verified('alice', 'alice@example.com');
  await assertSucceeds(setDoc(doc(db, 'customers', 'alice'), profile('alice', 'alice@example.com')));
  await assertFails(setDoc(doc(db, 'customers', 'bob'), profile('bob', 'alice@example.com')));
});

test('one customer cannot read another customer profile', async () => {
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'customers', 'bob'), {
      ...profile('bob', 'bob@example.com'),
      createdAt: new Date(),
      lastLoginAt: new Date(),
    });
  });
  await assertFails(getDoc(doc(verified('alice', 'alice@example.com'), 'customers', 'bob')));
});

test('profile updates reject ownership changes, schema pollution, privilege fields, and oversized data', async () => {
  const db = verified('alice', 'alice@example.com');
  const ref = doc(db, 'customers', 'alice');
  await assertSucceeds(setDoc(ref, profile('alice', 'alice@example.com')));
  await assertFails(updateDoc(ref, { customerId: 'bob' }));
  await assertFails(updateDoc(ref, { extraData: 'not allowed' }));
  await assertFails(updateDoc(ref, { isAdmin: true }));
  await assertFails(updateDoc(ref, { fullName: 'x'.repeat(121) }));
  await assertFails(updateDoc(ref, { createdAt: new Date(0) }));
});

test('customers create only pending and unconfirmed service requests', async () => {
  const db = verified('alice', 'alice@example.com');
  await assertSucceeds(setDoc(doc(db, 'orders', 'allowed'), order('alice')));
  await assertFails(setDoc(doc(db, 'orders', 'paid'), {
    ...order('alice'),
    paymentStatus: 'confirmed',
  }));
});

test('customers can query only their own orders and cannot update them', async () => {
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'orders', 'alice-order'), {
      customerId: 'alice', service: 'Instagram Management', notes: '', status: 'pending',
      paymentStatus: 'unconfirmed', createdAt: new Date(), updatedAt: new Date(),
    });
    await setDoc(doc(db, 'orders', 'bob-order'), {
      customerId: 'bob', service: 'YouTube Monetization', notes: '', status: 'pending',
      paymentStatus: 'unconfirmed', createdAt: new Date(), updatedAt: new Date(),
    });
  });
  const db = verified('alice', 'alice@example.com');
  await assertSucceeds(getDocs(query(collection(db, 'orders'), where('customerId', '==', 'alice'))));
  await assertFails(getDocs(query(collection(db, 'orders'), where('customerId', '==', 'bob'))));
  await assertFails(updateDoc(doc(db, 'orders', 'alice-order'), { status: 'completed' }));
});

test('verified administrators can manage status fields but cannot reassign ownership', async () => {
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'orders', 'managed-order'), {
      customerId: 'alice', service: 'Instagram Management', notes: '', status: 'pending',
      paymentStatus: 'unconfirmed', createdAt: new Date(), updatedAt: new Date(),
    });
  });
  const db = verified('owner', 'maximpress.org@gmail.com', { admin: true });
  await assertSucceeds(updateDoc(doc(db, 'orders', 'managed-order'), {
    status: 'active',
    paymentStatus: 'confirmed',
    progressNote: 'Work has started.',
    paymentReference: 'MANUAL-RECEIPT-001',
    updatedAt: serverTimestamp(),
  }));
  await assertFails(updateDoc(doc(db, 'orders', 'managed-order'), {
    customerId: 'owner',
    updatedAt: serverTimestamp(),
  }));
});

test('an admin claim without a verified email is denied', async () => {
  const db = env.authenticatedContext('owner', {
    email: 'maximpress.org@gmail.com',
    email_verified: false,
    admin: true,
  }).firestore();
  await assertFails(getDocs(collection(db, 'customers')));
});

test('the verified owner email has administration access and lookalike email does not', async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'customers', 'alice'), {
      ...profile('alice', 'alice@example.com'),
      createdAt: new Date(),
      lastLoginAt: new Date(),
    });
  });
  await assertSucceeds(getDocs(collection(
    verified('owner-email', 'maximpress.org@gmail.com'), 'customers'
  )));
  await assertFails(getDocs(collection(
    verified('lookalike', 'maximpresto.org@gmail.com'), 'customers'
  )));
});

test('verified customers can cast only their own valid review vote', async () => {
  const db = verified('alice', 'alice@example.com');
  await assertSucceeds(setDoc(doc(db, 'reviewVotes', 'r01', 'votes', 'alice'), {
    value: 1,
    updatedAt: serverTimestamp(),
  }));
  await assertFails(setDoc(doc(db, 'reviewVotes', 'r01', 'votes', 'bob'), {
    value: 1,
    updatedAt: serverTimestamp(),
  }));
  await assertFails(setDoc(doc(db, 'reviewVotes', 'r01', 'votes', 'alice'), {
    value: 99,
    updatedAt: serverTimestamp(),
  }));
});

test('review submissions start pending and only a verified admin moderates them', async () => {
  const customerDb = verified('alice', 'alice@example.com');
  await assertSucceeds(setDoc(doc(customerDb, 'reviewSubmissions', 'submission-one'), {
    uid: 'alice',
    name: 'Alice Customer',
    email: 'alice@example.com',
    service: 'Instagram Management',
    rating: 5,
    review: 'A genuine review long enough for the validation rules.',
    consent: true,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
  await assertFails(updateDoc(doc(customerDb, 'reviewSubmissions', 'submission-one'), {
    status: 'approved',
    updatedAt: serverTimestamp(),
  }));
  const adminDb = verified('owner', 'maximpress.org@gmail.com', { admin: true });
  await assertSucceeds(updateDoc(doc(adminDb, 'reviewSubmissions', 'submission-one'), {
    status: 'approved',
    updatedAt: serverTimestamp(),
  }));
});
