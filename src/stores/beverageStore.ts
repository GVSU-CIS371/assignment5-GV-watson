import { defineStore } from "pinia";
import {
  BaseBeverageType,
  CreamerType,
  SyrupType,
  BeverageType,
} from "../types/beverage";
import tempretures from "../data/tempretures.json";
import bases from "../data/bases.json";
import syrups from "../data/syrups.json";
import creamers from "../data/creamers.json";
import db from "../firebase.ts";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  QuerySnapshot,
  QueryDocumentSnapshot,
  onSnapshot,
  query,
  where,
  Unsubscribe,
  addDoc,
} from "firebase/firestore";
import type { User } from "firebase/auth";

export const useBeverageStore = defineStore("BeverageStore", {
  state: () => ({
    temps: tempretures,
    currentTemp: tempretures[0],
    bases: [] as BaseBeverageType[],
    currentBase: null as BaseBeverageType | null,
    syrups: [] as SyrupType[],
    currentSyrup: null as SyrupType | null,
    creamers: [] as CreamerType[],
    currentCreamer: null as CreamerType | null,
    beverages: [] as BeverageType[],
    currentBeverage: null as BeverageType | null,
    currentName: "",
    user: null as User | null,
    snapshotUnsubscribe: null as Unsubscribe | null,
  }),



  actions: {
    init() {
      const baseCollection = collection(db, "bases");
      getDocs(baseCollection)
        .then((qs: QuerySnapshot) => {
          if (qs.empty) {
            bases.forEach((b) => {
              const base = doc(db, `bases/${b.id}`);
              setDoc(base, { name: b.name, color: b.color })
                .then(() => {
                  console.log(`New base with ID ${b.id} inserted`);
                })
                .catch((error: any) => {
                  console.error("Error adding document: ", error);
                });
            });
            this.bases = bases;
          } else {
            this.bases = qs.docs.map((qd: QueryDocumentSnapshot) => ({
              id: qd.id,
              name: qd.data().name,
              color: qd.data().color,
            })) as BaseBeverageType[];
          }
          this.currentBase = this.bases[0];
          console.log("getting bases: ", this.bases);
        })
        .catch((error: any) => {
          console.error("Error getting documents:", error);
        });
      const syrupCollection = collection(db, "syrups");
      getDocs(syrupCollection)
        .then((qs: QuerySnapshot) => {
          if (qs.empty) {
            syrups.forEach((b) => {
              const syrup = doc(db, `syrups/${b.id}`);
              setDoc(syrup, { name: b.name, color: b.color })
                .then(() => {
                  console.log(`New syrup with ID ${b.id} inserted`);
                })
                .catch((error: any) => {
                  console.error("Error adding document: ", error);
                });
            });
            this.syrups = syrups;
          } else {
            this.syrups = qs.docs.map((qd: QueryDocumentSnapshot) => ({
              id: qd.id,
              name: qd.data().name,
              color: qd.data().color,
            })) as SyrupType[];
            console.log("getting syrups: ", this.syrups);
          }
          this.currentSyrup = this.syrups[0];
        })
        .catch((error: any) => {
          console.error("Error getting syrups:", error);
        });

      const creamerCollection = collection(db, "creamers");
      getDocs(creamerCollection)
        .then((qs: QuerySnapshot) => {
          if (qs.empty) {
            creamers.forEach((b) => {
              const creamer = doc(db, `creamers/${b.id}`);
              setDoc(creamer, { name: b.name, color: b.color })
                .then(() => {
                  console.log(`New creamer with ID ${b.id} inserted`);
                })
                .catch((error: any) => {
                  console.error("Error adding document: ", error);
                });
            });
            this.creamers = creamers;
          } else {
            this.creamers = qs.docs.map((qd: QueryDocumentSnapshot) => ({
              id: qd.id,
              name: qd.data().name,
              color: qd.data().color,
            })) as CreamerType[];

            console.log("getting creamers: ", this.creamers);
          }
          this.currentCreamer = this.creamers[0];
        })
        .catch((error: any) => {
          console.error("Error getting creamers:", error);
        });
    },



    showBeverage() {
      if (!this.currentBeverage) return;
      this.currentName = this.currentBeverage.name;
      this.currentTemp = this.currentBeverage.temp;
      this.currentBase = this.currentBeverage.base;
      this.currentSyrup = this.currentBeverage.syrup;
      this.currentCreamer = this.currentBeverage.creamer;
      console.log(
        `currentBeverage changed`,
        this.currentBase,
        this.currentCreamer,
        this.currentSyrup
      );
    },
    
   async makeBeverage() {
    //Checks whether a user is signed in,
    if (!this.user) {
      return "No user logged in, please sign in first.";
    }
    // Checks whether all required fields are filled in,
    if (
      !this.currentName ||
      !this.currentBase ||
      !this.currentSyrup ||
      !this.currentCreamer
    ) {
      return "Please complete all beverage options and the name before making a beverage.";
    }
    //Writes the beverage document to Firestore,
    const newBeverage  = {
        name: this.currentName,
        temp: this.currentTemp,
        base: this.currentBase,
        creamer: this.currentCreamer,
        syrup: this.currentSyrup,
      };
    await addDoc(collection(db, "beverages"), newBeverage); // Add new beverage to Firestore
    this.beverages.push(newBeverage as BeverageType); // Update local state
    this.currentName = "";
    //Updates the store state so the UI responds at once,
    this.currentBeverage = newBeverage as BeverageType;
    this.showBeverage();
    //Returns a short message such as:
    return `Beverage ${newBeverage.name} made successfully!`;
   },


   setUser(user: User | null) {
    //Saves the Firebase user in the store,
    this.user = user;

    //Stops the previous Firestore listener when the user changes,
    if (this.snapshotUnsubscribe) {
    this.snapshotUnsubscribe();
    this.snapshotUnsubscribe = null;
    }
    //Starts a new listener for the new user,
    if (user) {
      const beverageQuery = query(
        collection(db, "beverages"),
        where("userId", "==", user.uid)
      );
    //Updates beverage data when Firestore reports changes,
      this.snapshotUnsubscribe = onSnapshot(beverageQuery, (querySnapshot) => {
        const beverages: BeverageType[] = [];
        querySnapshot.forEach((doc) => {
          beverages.push({
            id: doc.id,
            name: doc.data().name,
            temp: doc.data().temp,
            base: doc.data().base,
            syrup: doc.data().syrup,
            creamer: doc.data().creamer,
          } as BeverageType);
        });
        this.beverages = beverages;
      });
    }
    //Sets currentBeverage correctly when the beverage list updates.
    if (this.currentBeverage) {
      const updatedBeverage = this.beverages.find((b) => b.id === this.currentBeverage?.id);
      this.currentBeverage = updatedBeverage || null;
    }
   },
  },
});
