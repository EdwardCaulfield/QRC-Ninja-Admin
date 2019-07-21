import { Injectable, isDevMode } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

import { QRC_Record } from './qrc-record';

@Injectable({
  providedIn: 'root'
})

export class FirebaseService {

  collectionName: string;
  storageMessage_duplicateRecordErrror = 1;
  storageMessage_unknownError = 2;
  recordsCollectionName = 'records';
  translationCollectionName = "keys";
  // firebaseKey:string;

  constructor( public dataBase: AngularFirestore ) { 

    if (isDevMode()) {
      this.collectionName = 'QRCLinksDev';
    } else {
      this.collectionName = 'QRCLinks';
    }

  }

  deleteKey( id: string ) {

    this.dataBase.collection(this.translationCollectionName).doc(id).delete()
      .then(_ => { })
      .catch(err => { console.log("Caught an error on deletion : " + err) })
      .finally(function () { })

  }

  addKey( record: QRC_Record ) {

    return this.dataBase.collection(this.translationCollectionName).add({

      openNewTab: record.openNewTab,
      urlString: encodeURIComponent( record.urlString ),
      shortName: encodeURIComponent( record.shortName )

    });

  }

  createTranslationPair( record:QRC_Record, updateIfFound: boolean ){

    if (!!record.shortName ) {
      
      // let openNewTab = record.openNewTab;
      // let urlString = encodeURIComponent( record.urlString );
      // let shortName = encodeURIComponent( record.shortName );

      this.getTranslationPair( encodeURIComponent( record.shortName ) ).subscribe( result => {
        //
        // We only store a new translation pair if one doesn't already exist
        //
        if ( !result || (result.docs.length == 0) ) {

          return this.addKey( record );

        } else if ( result.docs.length == 1 ) {

          //
          // We 'update' the record by deleting the old one and adding a new one
          //
          if ( updateIfFound ) {

            this.deleteKey(result.docs[0].id)
            return this.addKey(record);

          } else
            return this.storageMessage_duplicateRecordErrror;

        } else {

          return this.storageMessage_unknownError;

        }

      });
      
    } else {

      return null;

    }

  }

  getUserRecords( key ) {

    if ( !!key ) {

      return this.dataBase
        .collection(this.collectionName).doc(key).collection(this.recordsCollectionName)
        .snapshotChanges();
      
    }

  }

  getUserRecordsDoc( userID: number ){

    return this.dataBase
      .collection(this.collectionName, ref => ref.where('userID', '==', userID))
      .get();

  }

  getTranslationPair( shortName: string ) {

    return this.dataBase
      .collection(this.translationCollectionName, ref => ref.where('shortName', '==', shortName))
      .get();

  }

  encodeRecord( record : QRC_Record ) : QRC_Record {

    let newRecord = { ...record }; // shallow clone record
    //
    //  Escape undesirable characters
    // 
    newRecord.displayName = encodeURIComponent(record.displayName);
    newRecord.urlString = encodeURIComponent(record.urlString);
  
    if (!! record.shortName )
      newRecord.shortName = encodeURIComponent(record.shortName);
    if (!!record.callToActionLine1)
      newRecord.callToActionLine1 = encodeURIComponent(record.callToActionLine1);
    if (!!record.callToActionLine2)
      newRecord.callToActionLine2 = encodeURIComponent(record.callToActionLine2);

    return newRecord;
  }

  decodeRecord( record: QRC_Record ) : QRC_Record {

    let newRecord = { ...record }; // shallow clone record
    //
    //  Restore escaped characters
    // 
    newRecord.displayName = decodeURIComponent(record.displayName);
    newRecord.urlString = decodeURIComponent( decodeURIComponent(record.urlString) ); // somewhere the URL was encoded twice - fix later
    
    if (!!record.shortName)
      newRecord.shortName = decodeURIComponent(record.shortName);
    if (!!record.callToActionLine1)
      newRecord.callToActionLine1 = decodeURIComponent(record.callToActionLine1);
    if ( !! record.callToActionLine2 )
      newRecord.callToActionLine2 = decodeURIComponent(record.callToActionLine2);
      
    return newRecord;
  }

  storeRecord( key: string, record: QRC_Record ) {

    if (!!key && !!record ) {

      record = this.encodeRecord(record);
      this.dataBase.collection(this.collectionName).doc(key).collection(this.recordsCollectionName).add( {

        userID: record.userID,
        displayName: record.displayName,
        openNewTab: record.openNewTab,
        urlString: record.urlString,
        shortNameUsed: record.shortNameUsed,
        shortName: record.shortName,
        backgroundName: record.backgroundName,
        headerLanguage: record.headerLanguage,
        callToActionLine1: record.callToActionLine1,
        callToActionLine2: record.callToActionLine2,
        dateCreated: record.dateCreated,
        dateLastModified: record.dateLastModified,
        validUntil: record.validUntil

      }).then( 
        //
        // Save the ID to the record
        //
        result => { 
          record.firebaseID = result.id ; 
          //
          // Now, we also want to update the key information
          //
          if ( record.shortNameUsed ) {
            this.addKey( record );
          }

          return result;
        } 
        
        );

    } else {
      console.log("Invalid parameters passed to storeRecord");
    }

  }

  addUser( userID : number ) {

    return this.dataBase.collection(this.collectionName).add({ userID: userID });

  }

//   storeAllRecords( key: string, userID: number,  records: QRC_Record[] ) {

//     if (!!records && (records.length > 0)) {
//       // if this user doesn't have any records defined yet, then create their basic record information.
//       if ((key == undefined)) {

//         this.dataBase.collection(this.collectionName).add({ userID: userID }).then(
//           result => {
// //            this.firebaseKey = result.id;
//             for (let i = 0; i < records.length; i++) {
//               this.storeRecord(result.id, records[i] ) ;
//             }

//           }
//         )
//       } else {
//         //
//         // Store each record
//         //
//         records.forEach(record => {
//           this.storeRecord(key, record );
//         });
//       }
//     }

//   }

  deleteRecord(key: string , record: QRC_Record ) {
    
    if (!!key && !!record && !!record.firebaseID) {

      this.dataBase.collection(this.collectionName).doc(key).collection(this.recordsCollectionName).doc(record.firebaseID).delete()
        .then( _ => { } )
        .catch( err => { console.log("Caught an error on deletion : " + err)})
        .finally( function() { } )

    }

  }

  updateRecord( record: QRC_Record, key: string ) {
    //
    // The way we store records, we cannot just update a record
    // We have to delete the old one and add a new one
    //
    if (!!record && !!key ) {
      this.deleteRecord( key, record );
      this.storeRecord( key, record );
    }

  }

  createUserRecord( record: QRC_Record, key: string ){

    if (!!record && !! key)
     this.storeRecord( key, record );

  }

  // eraseRecord(key: string, record: QRC_Record ) {

  //   if (!!this.firebaseKey && !!record) {

  //     this.dataBase.collection(this.collectionName).doc(key).set({ ['record' + record.index]: "" }, { merge: true });

  //   } else {
  //     console.log("Invalid parameters passed to storeRecord");
  //   }

  // }

}

