import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  console.log("Fetching requests...");
  const q = query(collection(db, 'requests'));
  const snap = await getDocs(q);
  console.log("Total requests:", snap.docs.length);
  snap.docs.forEach(doc => {
    console.log(doc.id, "=>", doc.data().tipo, doc.data().userId);
  });
  process.exit(0);
}
run();
