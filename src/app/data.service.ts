import { Injectable, isDevMode } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { QRC_Record } from './qrc-record';
import { Key_Record } from './key-record';

@Injectable({
  providedIn: 'root'
})

export class DataService {

//  ELEMENT_DATA = {} as QRC_Record[]; 

  newRecordForm: any;
  recordMultiplier = 472 ; // I use an id multiplier to help mask the id of the record and protect from hacking
  baseURL: string;
  public recordCount: number;
  public storageMessage_success = -1;
  public storageMessage_unknownError = -2;
  public storageMessage_duplicateRecordErrror = -422;

  message_ErrorFetchingUserRecords = "Error fetching user records : ";
  message_ErrorStoringserRecords = "Error storing user records : ";
  message_ErrorDeletingUserRecords = "Error deleting user records : ";
  message_BaseURLNotDefined = "Base URL is not defined";

  file_Delete = "Pga1yTcm7s6EFbq.php";
  file_Store = "DCc8aAzO8KgQ8es14.php";
  file_Update = "4lHCdDJ8RJD6hsM.php";
  file_AddKey = "aLFtIRo6Mpp4WD3.php";
  file_GetUserRecords = "Crpyrfsq0muBEgt.php";
  key_Delete = "8zmiM2uhXVCo9q6";

  constructor( private http: HttpClient ) { 

    if ( isDevMode() ) {
      this.baseURL = 'http://localhost:8080/wordpress/api/obfuscated/';
    } else {
      this.baseURL = 'https://qrc.ninja/api/';
    }
  }

  createKeyRecord( shortName: string): Observable<number> {

    if (!!this.baseURL) {
      
     return this.http.post(`${this.baseURL}${this.file_AddKey}`, { data: shortName })
        .pipe(map((res) => {
          let errorFound = res['error'];
          if (errorFound == '422') { // Insert failed - assume a duplicate record
            return this.storageMessage_duplicateRecordErrror;
          } else if ( errorFound ) {
            console.log(this.message_ErrorStoringserRecords + errorFound);
            return this.storageMessage_unknownError;
          } else {
            return this.storageMessage_success;
          }
        }),
          catchError(this.handleError)
        );
    } else {
      console.log(this.message_BaseURLNotDefined);
    }
  }

createUserRecord( record: QRC_Record ): Observable<any> {

  record.id = this.obfuscateRecordID( 1 );

  if (!!this.baseURL ) {
    return this.http.post(`${this.baseURL}${this.file_Store}`, {data: record })
      .pipe( map((res) => {
        let errorFound = res['error'];
        if ( errorFound ) {
          console.log(this.message_ErrorStoringserRecords + errorFound);
          return res;  
        } else {
          return res;
        }
      }),
      catchError( this.handleError )
    );
  } else {
    console.log(this.message_BaseURLNotDefined);
  }
}
//
// We want to ensure that we support unicode and at the same time make sure that we don't have any exposer to
// SQL Injection.  To accomplish this, strings will be converted to unicode strings.
//
convertUnicodeToString( text: string ): string {

  let newText =  text.replace(/\\u[\dA-F]{4}/gi, 
    function (match) {
         return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
    });
    
  return newText;

}

convertStringToUnicode( text: string ) : string {

  var newText = "";
  for(var i = 0; i < text.length; i++){
      // Assumption: all characters are < 0xffff
      newText += "\\u" + ("000" + text[i].charCodeAt(0).toString(16)).substr(-4);
  }

  return newText;

}

deleteSQLRecord( id: number ) : Observable<QRC_Record>  {

  if (!!this.baseURL ) {
    return this.http.get(`${this.baseURL}${this.file_Delete}?ipsilip=${this.key_Delete}&rtfu=` + this.obfuscateRecordID( id )).pipe(
      map((res) => {
        if ( !!res ) {
          let errorFound = res['error'];
          if ( errorFound ) {
            console.log(this.message_ErrorDeletingUserRecords + errorFound);
            return errorFound;  
          }
         } else {
          return of( res ); 
        }
      }),
      catchError( this.handleError )
    );
  } else {
    console.log(this.message_BaseURLNotDefined);
  }

  return of( );

}
//
// When a record is updated, we obfuscate the ID as a security measure
// Return the id to the original number once the database request is sent
//
obfuscateRecordID( id: number ) : number {

  return id * this.recordMultiplier;

}

updateRecord( record: QRC_Record ) : Observable<any> {
 
  let newRecord = {...record}; // clone the record and obfuscate it
  newRecord.id = this.obfuscateRecordID( newRecord.id );

  if (!!this.baseURL ) {

    return this.http.post(`${this.baseURL}${this.file_Update}`, { data: newRecord })
      .pipe( map((res) => {
        debugger;
        let errorFound = res['error'];
        if ( errorFound ) {
          console.log(this.message_ErrorStoringserRecords + errorFound);
          return errorFound;  
        } else {
            
          return res;
        }
      }),
      catchError( this.handleError )
    );
  } else {
    console.log(this.message_BaseURLNotDefined);
  }

  return;

}

getUserRecords( userID: number ): Observable<QRC_Record[]> {
  //
  if (!!this.baseURL ) {
    return this.http.get(`${this.baseURL}${this.file_GetUserRecords}?user=`+userID).pipe(
      map((res) => {
        let errorFound = res['error'];
        if ( errorFound ) {
          console.log(this.message_ErrorFetchingUserRecords + errorFound);
          return errorFound;
        } else {
            return res['data'] ; 
        }
      }),
      catchError( this.handleError )
    );
  } else {
    console.log(this.message_BaseURLNotDefined);
  }
}

private handleError(error: HttpErrorResponse) {
  console.log(error);
  // return an observable with a user friendly message
  return throwError('HTTP Error! ' + error.message );
}

}
