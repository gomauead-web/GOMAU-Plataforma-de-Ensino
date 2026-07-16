import { db } from './src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function run() {
  const users = await getDocs(collection(db, 'users'));
  console.log("Total Users in DB:", users.docs.length);

  const reqs = await getDocs(collection(db, 'requests'));
  console.log("Total Requests in DB:", reqs.docs.length);
  reqs.forEach(d => console.log(d.id, d.data().tipo, d.data().status));
  process.exit(0);
}
run().catch(console.error);
