import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatDialog, MatTable } from '@angular/material';
import { FormGroup } from '@angular/forms';

import 'rxjs/add/operator/debounceTime';

import { DataService } from '../data.service'
import { AuthService } from '../auth.service';
//import { FirebaseService } from '../firebase.service';
import { RestAPIService } from '../rest-api.service';
import { QRC_Record } from '../qrc-record';

import * as QRCode from '../qrcode-modified.js';
import { debug } from 'util';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent  implements  OnInit {

  googleDisplayName = "";
  //loggedIn= false;
//  firebaseKey: string;
//  firebaseEmpty: boolean;
  dontUpdate = false; // kinda confusing - it means we don't update a record if found
  updateIfFound = true;
  qrcodeSize = 150;
  openNewTab: boolean; // for some odd reason, I cannot get the forms to work nicely with sliders, so I kluge with a global variable
  marginLeft = this.qrcodeSize / 2;
  marginTop = this.qrcodeSize;
  deaultOpenNewTab = true;
  defaultDownloadFileName = "QRC Ninja Image.png";
  downloadFileName = this.defaultDownloadFileName;
  imageData: any;
  adminUsers = [ 1, 2 ];
  isAdmin = false;
  headerLanguages = [ { shortName: 'en', longName: 'English'}, { shortName: 'de', longName:'German' }];
  defaultHeaderLanguage = 'en';
  selectedHeaderLanguage: string;

  alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  shortNameLengthFreeVersion = 15;
  canvasWidthMultiplier = 2.6;
  canvasHeightMultiplier = 1.2;
//
// data for the creation of the QR Code
//
  allowEmptyString: boolean = true;
  colordark: string = '#000000';
  colorlight: string = '#ffffff';
  level: string = 'M';
  hidetitle: boolean = false;
  qrdata: string = 'this is a string';
  size: number = this.qrcodeSize;
  usesvg: boolean = false;
  canvasWidth: number = this.size + this.marginLeft * this.canvasWidthMultiplier;
  canvasHeight: number = this.size + this.marginTop * this.canvasHeightMultiplier;
  offsetTop: number = this.canvasHeight * .2;
  offsetLeft: number = (this.canvasWidth - this.size ) / 2;

  fontSize = 16;
  fontName = "Arial";
  maxRecursionDepth = 3;

  readWithQRCNinjaLine1_delta = .08;
  readWithQRCNinjaLine1FieldName = "ReadLine1";
  readWithQRCNinjaLine1 = [
    { language:'en', text: "Read with QRC.Ninja"},
    { language:'de', text: "Mit QRC.Ninja lesen"}
  ];

  readWithQRCNinjaLine1_yPosition = this.canvasHeight * this.readWithQRCNinjaLine1_delta; //.08;

  spaceBetweenReadWithLine1andLine2 = this.fontSize;
  readWithQRCNinjaLine2FieldName = "ReadLine2";

  readWithQRCNinjaLine2 = [
    { language: 'en', text: "Browser Extension"},
    { language: 'de', text: "Browser Erweiterung"}
  ];// "Browser Extension";

  readWithQRCNinjaLine2_yPosition = this.readWithQRCNinjaLine1_yPosition + this.spaceBetweenReadWithLine1andLine2;
  
  trademarkCharacterCode = 174;
  trademarkIndent = .19 * this.canvasWidth;
  chromeTrademarkFieldName = "Chrome";
  chromeTrademark = "Chrome " + String.fromCharCode( this.trademarkCharacterCode );
  chromeTrademark_yPosition = this.trademarkIndent;

  firefoxTrademarkFieldName = "FireFox";
  firefoxTrademark = "FireFox " + String.fromCharCode(this.trademarkCharacterCode);
  firefoxTrademark_yPosition = this.trademarkIndent;

  callToActionFontSizeIncrement = 2;
  callToActionFontSize = this.fontSize * this.callToActionFontSizeIncrement;
  callToActionLine1FieldName = "callToActionLine1";
  callToActionLine1_yPosition = -.19*this.canvasHeight;
  callToActionEraseHeight = this.callToActionLine1_yPosition + this.callToActionFontSize;

  spacingBetweenCTALine1andLine2 = this.callToActionFontSize ;
  callToActionLine2FieldName = "callToActionLine2";
  callToActionLine2_yPosition = this.callToActionLine1_yPosition +  this.spacingBetweenCTALine1andLine2;
  
  public qrcode: any;
  canvasContext: any;
  defaultFontSize: string = "24";

  activeRecord = {} as QRC_Record;
  originalRecord = {} as QRC_Record;

  defaultString = "";

  qrCodeGenerated = true;
  editingRecord = false;
  urlIsValid = false;
  urlIsSecure = false;
  urlIsInsecure = false;
  downloadButtonDisabled = true;

  minNameLength = 1;
  maxNameLength = 200;
  minCallToActionLength = 1;
  maxCallToActionLength = 30;
  longURLString = 200;
  shortURLString = 50;
  shortURLStringAdmin = 100;
  defaultShortNameUsage = false;
  urlStringMaxLength = this.shortURLString;
  benefitsOfShortNames = ". Up to 200 characters are available if you use a short name";
  additionalURLMessage = this.benefitsOfShortNames;

  messageDeleteConfirmation_Part1 = "Are you sure you want to delete the record : ";
  messageDeleteConfirmation_Part2 = "? This cannot be reversed!!";

  messageMustGoToNewTab = "You must go to a new tab if you disable the Short Name.  Continue?";

  messageOpenNewTab = "Staying on the same page requires that a Short Name is used.  Continue?";
  messageDisableShortNameAlso = "Should I disable Short Name usage also?";
  defaultBackgroundName = "bg01";

  constructor( 
    private dataService: DataService, 
    private authService: AuthService,
    private api: RestAPIService, 
//    private firebase: FirebaseService,
    public dialog: MatDialog
    
    ) { }

  displayedColumns = ['displayName', 'headerLanguage', 'openNewTab', 'shortName',  'callToActionLine1', 'callToActionLine2', 'urlString', 'delete'];
   
  @ViewChild(MatTable) table: MatTable<any>;
  @ViewChild('myCanvas') myCanvas: ElementRef;
  @ViewChild('downloadButton') downloadButton: ElementRef;
  @ViewChild('newRecordForm') myForm: FormGroup;
//  @ViewChild('useShortname') useShortname: any;

  form_openNewTab: any;
//  userRecords: QRC_Record[];
  newUserRecords: QRC_Record[];
  recordCount : number;
  maxRecords = 5; // for beta purposes, we limit to 5 records per user
  adminMaxRecords = 100;
  userID: number;
  dataHasChanged = false;
  formReady = false;

  public ngAfterViewInit(): void {
    
//    this.myForm.valueChanges.subscribe(data => this.monitorInputData(data));

  }

  checkForAminRights( userID: number ) : boolean {
    
    let AdminFound = this.adminUsers.find( id => 
      userID == id
    );
 
    return !!AdminFound;
  }

  public copyFromFirebaseToSQL() : void {
    //
    if (!!this.newUserRecords) {
      this.newUserRecords.forEach( (record) => {
        this.dataService.createUserRecord( record )
          .subscribe( result => {
            console.log("Create record result is : " + result.id);
          });

        if ( record.shortNameUsed ) {
          this.dataService.createKeyRecord(record.shortName)
            .subscribe( result => {
              console.log("Create key result is : " + result);
            });
        }

      });
    }


    //     if (!!this.userRecords ) {

//       this.firebase.storeAllRecords(this.firebaseKey, this.userID, this.userRecords);

//       let index = 0;
//       this.userRecords.forEach(record => {

//         if (record.shortNameUsed) {
//           this.firebase.createTranslationPair( record );
//         }

//       })
//     } else {
// //      console.log("What, no records?");
//     }
    
  }

  toggleOpenNewTab( newValue : boolean ) {
    //
    // the value passed by the form cannot be trusted.  Instead, be confident
    // the the form already changed the value of the active record
    // 
    if ( this.openNewTab && !this.activeRecord.shortNameUsed ) {  // are we turning the switch off?

      if (confirm(this.messageOpenNewTab)) {  // warn the user that short codes have to be used 

        this.openNewTab = false
        if (this.originalRecord != undefined) {
          if ( this.originalRecord.openNewTab )
            this.dataHasChanged = true;
        }

        if (!this.activeRecord.shortNameUsed) {
          this.setShortNameVariables(true);
        }

      } else { // The user cancelled the operation, reset the active record value

      }  

    }  else if ( !this.openNewTab && this.activeRecord.shortNameUsed ) {  // or on?

      this.openNewTab = true;

      if ( this.activeRecord.shortNameUsed ) {
        
        // ask if they want to stop using a Short Name
        if (confirm(this.messageDisableShortNameAlso))  {
          this.setShortNameVariables(false);
          this.dataHasChanged = true;

        } 

      }

    } else {

      this.openNewTab = !this.openNewTab;

    }
    
    this.activeRecord.openNewTab = this.openNewTab; // kludge, kludge
    this.updateForm();

  }

  updateForm() {
    this.myForm.setValue({
      displayName: this.activeRecord.displayName,
      urlString: this.activeRecord.urlString,
      callToActionLine1: this.activeRecord.callToActionLine1,
      callToActionLine2: this.activeRecord.callToActionLine2,
      useShortname: this.activeRecord.shortNameUsed,
      openNewTab: this.activeRecord.openNewTab
    });

  }

  monitorInputData( data: any ) {

    let newDisplayName = data['displayName'];
    let newOpenNewTab = data['openNewTab'];
    let newCallToActionLine1 = data['callToActionLine1'];
    let newCallToActionLine2 = data['callToActionLine2'];
    let newShortNameUsed = data['shortNameUsed'];
    let newURLString = data['urlString'];


    //
    // Check for changes in the short name
    //  
    if (newOpenNewTab != undefined ) {
      this.activeRecord.openNewTab = newOpenNewTab;

      if (this.activeRecord.openNewTab != this.originalRecord.openNewTab)
        this.dataHasChanged = true;

    } 

    if (newShortNameUsed != undefined) {

      this.activeRecord.shortNameUsed = newShortNameUsed;

      if (this.activeRecord.shortNameUsed != this.originalRecord.shortNameUsed) {
        this.dataHasChanged = true;

        if ( !!this.qrcode && this.activeRecord.shortNameUsed ) {

          if ( !!this.activeRecord.shortName ) 
            this.makeQRCode(this.activeRecord.shortName);
          else 
            this.clearQRCode();

        }

      }


    }

    if (newDisplayName != undefined) {


      if (!newDisplayName) {
        this.activeRecord.displayName = "";
      } else if (newDisplayName != this.activeRecord.displayName) {
        this.activeRecord.displayName = newDisplayName;
      }

    } 

    if (newURLString != undefined) {

      let urlStringWasChanged = false;

      if (this.qrcode) {
        if (!newURLString && !this.activeRecord.urlString) {
          // both were already empty, do nothing          
        } else if (!newURLString && this.activeRecord.urlString) {
          urlStringWasChanged = true;  // string was erased
        } else if (newURLString != this.activeRecord.urlString) {
          urlStringWasChanged = true;
        }

        if (urlStringWasChanged) {
          this.validateURL(newURLString);
          this.activeRecord.urlString = newURLString;
          //
          // If the short name is used, then it will already have
          // been displayed.  Otherwise, display the url string
          //
          if (!this.activeRecord.shortNameUsed) {
            if (!newURLString) {           // An empty url string means no code

              this.clearQRCode();

            }
            else {
              this.makeQRCode(newURLString);
            }
          }
        }
      }
    } 

    if ( newCallToActionLine1 != undefined ) {

      if (!newCallToActionLine1) {
        //
        // No elegant way to catch blank lines
        //
        this.activeRecord.callToActionLine1 = "";
        this.updateField(this.callToActionLine1FieldName);

      }
      if (newCallToActionLine1 != this.activeRecord.callToActionLine1) {

        this.activeRecord.callToActionLine1 = newCallToActionLine1;
        this.updateField(this.callToActionLine1FieldName);

      }
    } 

    if ( newCallToActionLine2 != undefined ) {

      if (!newCallToActionLine2) {
        //
        // No elegant way to catch blank lines
        //
        this.activeRecord.callToActionLine2 = "";
        this.updateField(this.callToActionLine1FieldName);

      }
      if (newCallToActionLine2 != this.activeRecord.callToActionLine2) {

        this.activeRecord.callToActionLine2 = newCallToActionLine2;
        this.updateField(this.callToActionLine2FieldName);

      }
    } 

//    console.log('Form changes', data);

  this.checkForChanges();

}

  checkForChanges() {
    //
    // Compare the current record to the original record and 
    // see if any data has changed
    //
    this.dataHasChanged = false;

    for (let key of Object.keys(this.activeRecord)) {

      // We exclude 'shortNameused' and 'openNewTab' because for some reason boolens are not processed
      // correctly
      if ((this.activeRecord[key] != this.originalRecord[key]) && (key != 'shortNameUsed') && (key != 'openNewTab'))
        this.dataHasChanged = true;

    }

    this.dataHasChanged = this.dataHasChanged || (this.originalRecord.openNewTab    != this.activeRecord.openNewTab    );
    this.dataHasChanged = this.dataHasChanged || (this.originalRecord.shortNameUsed != this.activeRecord.shortNameUsed );

  }

  clearQRCode() {

    if ( !!this.qrcode ) {

      this.qrcode.clear();
      this.downloadButtonDisabled = true;

    }
  }

  updateDownloadButton() {
      //
      // when the link is clicked, the specificed file will be donwloaded
      //
    this.imageData = this.myCanvas.nativeElement.toDataURL('image/jpg');

  }

  makeQRCode( text: string ) {

    if (!!this.qrcode ) {

      this.qrcode.makeCode(text);
      this.updateDownloadButton();
      this.downloadButtonDisabled = false;

    }

  }

  showAddNewRecordButton() : boolean {

    return this.urlIsValid && !this.duplicateDisplayName () && ( (!this.editingRecord && this.dataHasChanged) || this.displayNameHasChanged() ) ;

  }

  duplicateDisplayName() : boolean {
  
    let foundRecord = null;
    if (!!this.newUserRecords ) {

      foundRecord = this.newUserRecords.find( record  => 
        (record.id != this.activeRecord.id) && (record.displayName == this.activeRecord.displayName)
//          (record.firebaseID != this.activeRecord.firebaseID) && (record.displayName == this.activeRecord.displayName)
      );
    
    }
    
    return !!foundRecord ? true : false;

  }


  displayNameHasChanged() : boolean {

    if (!!this.originalRecord && !!this.activeRecord ) {
      return this.originalRecord.displayName != this.activeRecord.displayName;
    } else
      return false;

  }
  
  showUpdateButton() : boolean {

    if (!this.activeRecord)
      return false;
    else
      return this.editingRecord && 
             this.dataHasChanged && 
             !this.duplicateDisplayName() && 
             !(this.urlIsInsecure && !this.activeRecord.shortNameUsed);

  }

  validateURL( url: string )  {

    this.urlIsInsecure = false;
    this.urlIsSecure = false;

    if (!url) {
      this.urlIsValid = false;
    }
    else if (url == "") {
      this.urlIsValid = false;
    }
    else {
      this.urlIsSecure = this.isSecureURL(url); 
      this.urlIsInsecure = this.isInsecureURL(url); 
      this.urlIsValid = this.urlIsSecure || 
          (this.urlIsInsecure && this.activeRecord.shortNameUsed);
      // !this.urlIsInsecure && !this.urlIsSecure;
    }
    
  }

  isInsecureURL(str: string): boolean {
    str = str.trim();

    var pattern = new RegExp('^(http:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name and extension
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?' + // port
      '(\\/[-a-z\\d%@_.~+&:]*)*' + // path
      '(\\?[;&a-z\\d%@_.,~+&:=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return pattern.test(str);
  }

  isSecureURL(str: string) : boolean {
    str = str.trim();

    var pattern = new RegExp('^(https:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name and extension
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?' + // port
      '(\\/[-a-z\\d%@_.~+&:]*)*' + // path
      '(\\?[;&a-z\\d%@_.,~+&:=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return pattern.test(str);
  }

  prepareCanvas() {

    this.myCanvas.nativeElement.width = this.canvasWidth;
    this.myCanvas.nativeElement.height = this.canvasHeight;

    this.canvasContext = this.myCanvas.nativeElement.getContext("2d");
    this.canvasContext.font = this.fontSize + "px " + this.fontName;
    this.canvasContext.textAlign = 'center';

    this.selectedHeaderLanguage = this.defaultHeaderLanguage;

  }

  changeLanguage( newLanguage ) {

    if ( !!this.activeRecord ) {
      //
      // Change to the new language
      this.activeRecord.headerLanguage = newLanguage.shortName;
      //
      // Erase the previous labels
      this.canvasContext.save();
      this.canvasContext.fillStyle = "white";
      this.canvasContext.fillRect(0, this.readWithQRCNinjaLine1_yPosition - this.fontSize, this.canvasWidth, this.fontSize * 2.5);
      this.canvasContext.restore();
      //
      // Print the labels under the new language
      this.updateField(this.readWithQRCNinjaLine1FieldName);
      this.updateField(this.readWithQRCNinjaLine2FieldName);

      if (!!this.activeRecord && !!this.originalRecord) {
        this.dataHasChanged = this.activeRecord.headerLanguage != this.originalRecord.headerLanguage;
      }

    }

  }

  getUserRecords( ) {

    this.dataService.getUserRecords(this.userID)
      .subscribe(result => {
        this.newUserRecords = result;
        this.recordCount = this.newUserRecords.length;
        this.newUserRecords.forEach(record => {
          record.shortNameUsed = record.shortNameUsed == "0" ? false : true;
          record.openNewTab = record.openNewTab == "0" ? false : true;
        })
      });

    // this.firebase.getUserRecordsDoc(this.userID).subscribe( querySnapshot => {
    //   //
    //   // The snapshot will be empty if there is no user data

    //   if ( querySnapshot.empty ) {

    //     this.firebase.addUser( this.userID ).then(
    //       result => {
    //         this.firebaseKey = result.id;
    //         this.getUserRecords();
    //       }
    //     ) ;

    //   }  else {  // User exists and has records
        
    //     querySnapshot.forEach(doc => {

    //       this.firebaseKey = doc.id;
    //       //        console.log("The key is : " + this.firebaseKey);
    //       this.firebase.getUserRecords(this.firebaseKey).subscribe(results => {

    //         this.newUserRecords = new Array<QRC_Record>();
    //         results.forEach(record => {

    //           let newRecord = this.firebase.decodeRecord(record.payload.doc.data() as QRC_Record);
    //           newRecord.firebaseID = record.payload.doc.id;

    //           // let newRecord = this.firebase.decodeRecord(  record.data() as QRC_Record );
    //           // newRecord.firebaseID = record.id;

    //           //
    //           // If a translation pair doesn't exist, have one created
    //           //
    //           if (newRecord.shortNameUsed) {

    //             //              console.log( newRecord.displayName +  " has a shortname of " + newRecord.shortName );
    //             this.firebase.createTranslationPair(newRecord, this.dontUpdate);

    //           } 

    //           this.newUserRecords.push(newRecord);

    //         });

    //         this.recordCount = this.newUserRecords.length;
    //         this.newUserRecords.sort(this.compareByDisplayName);
    //         // this.recordCount = this.userRecords.length;

    //         // this.table.renderRows();

    //       });

    //     });

    //   }

    // });

  }
  
  compareByDisplayName(a, b) {
    
    return a.displayName.localeCompare(b.displayName)
    // if (a.displayName < b.displayName)
    //   return -1;
    // if (a.displayName > b.displayName)
    //   return 1;
    // return 0;
  }

  userIsLoggedIn() {

    return this.authService.userIsLoggedIn();

  }
  
  getUserIDandRecords() {

//    console.log("Getting user id and records");

    if ( this.userIsLoggedIn() ) {

      this.api.getUserID().subscribe(result => {
        this.userID = result.id;
        this.getUserRecords();

        this.isAdmin = this.checkForAminRights(this.userID);

        if (this.isAdmin) {

          if (this.urlStringMaxLength == this.shortURLString)
            this.urlStringMaxLength = this.shortURLStringAdmin;

          this.shortURLString = this.shortURLStringAdmin;
          this.maxRecords = this.adminMaxRecords;
        }

      });

    }

  }

  setDownloadFileName( fileName: string ) {

//    this.downloadButton.nativeElement.setAttribute('download', fileName);

  }

  initializeActiveRecord() {
    //
    // Input mask data
    //
    this.activeRecord.displayName = this.defaultString;
    this.activeRecord.openNewTab = this.deaultOpenNewTab;
    this.activeRecord.urlString = this.defaultString;
    this.activeRecord.shortName = this.defaultString;
    this.activeRecord.callToActionLine1 = this.defaultString;
    this.activeRecord.callToActionLine2 = this.defaultString;
    this.activeRecord.headerLanguage = this.defaultHeaderLanguage;
    this.setShortNameVariables(this.defaultShortNameUsage);

    this.originalRecord = {...this.activeRecord};
    //
    // I cannot get the slider to work as I wish, so I kludge with this
    //
    this.openNewTab = this.activeRecord.openNewTab;
  }

  initializeQRCode() {
    //
    // Create the skeleton of the QR Code display and then clear it.  Simplifies processing for later
    //
    try {

      this.qrcode = new QRCode(this.myCanvas.nativeElement, {
        colorDark: this.colordark,
        colorLight: this.colorlight,
        correctLevel: QRCode.CorrectLevel[this.level.toString()],
        height: this.size,
        text: this.qrdata || ' ',
        useSVG: this.usesvg,
        width: this.size,
        offsetTop: this.offsetTop,
        offsetLeft: this.offsetLeft,
        canvasWidth: this.canvasWidth,
        canvasHeight: this.canvasHeight,
      });

    } catch (e) {
      console.error('Error generating QR Code: ' + e.message);
    }

    this.clearQRCode();
    this.setDownloadFileName( this.defaultDownloadFileName );
    this.qrCodeGenerated = false;
    this.canvasContext.fillStyle = "white";
    this.canvasContext.fillRect(0, 0, this.myCanvas.nativeElement.width, this.myCanvas.nativeElement.height );
    //
    // Draw the text at the top of the bar code
    //
    this.canvasContext.fillStyle = "black";
    this.updateField(this.readWithQRCNinjaLine1FieldName);
    this.updateField(this.readWithQRCNinjaLine2FieldName);
    //
    // Rotate left 90 degrees and place the Chrome label
    //
    this.updateField(this.chromeTrademarkFieldName);
    //
    // Rotate right 90 degrees and place the Firefox label
    //
    this.updateField(this.firefoxTrademarkFieldName);
    //
    // Now do the call to action strings...
    //
    this.updateField(this.callToActionLine1FieldName);
    this.updateField(this.callToActionLine2FieldName);

  }

  ngOnInit() {

    this.prepareCanvas();

    this.getUserIDandRecords();

    this.initializeActiveRecord();

    this.initializeQRCode();

    //    this.doGoogleLogin();

    this.myForm.valueChanges.subscribe(data => this.monitorInputData(data));

  }

  doGoogleLogin() {
    
    this.getUserIDandRecords();

    this.prepareCanvas();

    this.initializeQRCode();

    this.myForm.valueChanges.subscribe(data => this.monitorInputData(data));

//    this.table.renderRows();

    // if (!this.authService.userIsLoggedIn()) {
    //   this.authService.doGoogleLogin()
    //     .then(result => {
    //       if (!!result && !!result.user) {

    //         this.googleDisplayName = result.user.displayName;
            
    //         this.getUserIDandRecords();

    //         this.prepareCanvas();

    //         this.initializeQRCode();

    //         this.myForm.valueChanges.subscribe(data => this.monitorInputData(data));

    //       } else {
    //       }
    //     });

    // }
  }

  updateField( fieldName: string ) : void {

    this.canvasContext.save();
    this.canvasContext.fillStyle = "black";
    this.canvasContext.textAlign = 'center';

    switch (fieldName) {
      case this.callToActionLine1FieldName:
      case this.callToActionLine2FieldName: {

        // Because drawing is just laying things on top of the canvas, first erase previous values
        this.canvasContext.fillStyle = "white";

//        this.canvasContext.fillRect(0, this.canvasHeight - this.callToActionEraseHeight, this.canvasWidth, this.callToActionEraseHeight);
        this.canvasContext.fillRect(0, this.canvasHeight + this.callToActionLine1_yPosition - this.callToActionFontSize, this.canvasWidth, this.canvasHeight);

        this.canvasContext.fillStyle = "black";
        this.canvasContext.translate(this.canvasWidth / 2, this.canvasHeight);

        if (!!this.activeRecord.callToActionLine1) {

          this.placeLabel(this.activeRecord.callToActionLine1, this.callToActionLine1_yPosition, this.callToActionFontSize);

        }
        if (!!this.activeRecord.callToActionLine2) {

          this.placeLabel(this.activeRecord.callToActionLine2, this.callToActionLine2_yPosition, this.callToActionFontSize);

        }
        break;
      }

      case this.readWithQRCNinjaLine1FieldName: {

        this.canvasContext.translate(this.canvasWidth / 2, 0);
        let label = this.readWithQRCNinjaLine1.find(record => record.language == this.activeRecord.headerLanguage);
        this.placeLabel(label.text, this.readWithQRCNinjaLine1_yPosition);

        break;
      }

      case this.readWithQRCNinjaLine2FieldName: {
    
        this.canvasContext.translate(this.canvasWidth / 2, 0);
        let label = this.readWithQRCNinjaLine2.find( record => record.language == this.activeRecord.headerLanguage );
        this.placeLabel(label.text, this.readWithQRCNinjaLine2_yPosition);

        break;
      }
      case this.chromeTrademarkFieldName: {

//        this.canvasContext.translate(0, this.canvasHeight / 2);
        this.canvasContext.translate(0, this.offsetTop + (this.size / 2));
        this.canvasContext.rotate(-Math.PI / 2);

        this.placeLabel(this.chromeTrademark, this.chromeTrademark_yPosition);

      }

      case this.firefoxTrademarkFieldName: {

//        this.canvasContext.translate(this.canvasWidth, this.canvasHeight / 2);
        this.canvasContext.translate(this.canvasWidth, this.offsetTop + (this.size / 2));
        this.canvasContext.rotate(Math.PI / 2);
        this.placeLabel(this.firefoxTrademark, this.firefoxTrademark_yPosition);

      }
      default: {

        break;
      }
    }
    
    this.canvasContext.restore();

  }

  placeLabel( text: string, yPos: number, fontSize?: number ) : void {
    //
    // We wil assume that for all text positining, the canvas has been
    // translated and rotated to the desired position
    //
    let newFontSize: number;
    if (fontSize)
      newFontSize = fontSize;
    else
      newFontSize = this.fontSize;

    this.canvasContext.font = newFontSize + "px " + this.fontName;
    this.canvasContext.fillText(text, 0, yPos, this.canvasWidth );

    this.updateDownloadButton();
  }

  setShortNameVariables( shortNameIsUsed : boolean, confirmChange?: boolean) : boolean {

    confirmChange = confirmChange || false;
    let doWork = true;

    if ( confirmChange && !shortNameIsUsed && !this.activeRecord.openNewTab ) { // cannot have them both false at the same time

      doWork = confirm(this.messageMustGoToNewTab) ;
      this.activeRecord.openNewTab = doWork;

    }

    if ( doWork ) {

      this.activeRecord.shortNameUsed = shortNameIsUsed;
      if (shortNameIsUsed) {

        this.urlStringMaxLength = this.longURLString;
        this.additionalURLMessage = "";
        if (!this.activeRecord.shortName) {
          this.clearQRCode();
        }
        else {
          this.makeQRCode(this.activeRecord.shortName);
        }
      } else {

        this.urlStringMaxLength = this.shortURLString;

        this.additionalURLMessage = this.benefitsOfShortNames;

        if (!!this.activeRecord.urlString && !!this.qrcode) {
          this.makeQRCode(this.activeRecord.urlString);

        }
        else if (!!this.qrcode) {
          this.clearQRCode();
        }

      }

      if (confirmChange)
        this.updateForm();
    }

    this.checkForChanges();

    return shortNameIsUsed;

  }

  generateShortName() : string {

    let newShortName = "";
    for( let i = 0; i < this.shortNameLengthFreeVersion ; i++ )
      newShortName += this.getRandomCharacter();

    return newShortName;
  
  }

  getRandomCharacter() : string {

    return this.alphabet.charAt(Math.floor(Math.random() * (this.alphabet.length - 1)));

  }

  determineRecordDuration() : Date {

    let today = new Date();
  
    return new Date( today.getFullYear() + 1, today.getMonth(), today.getDay() );

  }
  
  clearActiveRecord( root?: any ) :void {

    root = root || this;

    root.activeRecord.displayName = root.defaultString;
    root.activeRecord.openNewTab = root.deaultOpenNewTab;
    root.activeRecord.urlString = root.defaultString;
    root.activeRecord.callToActionLine1 = root.defaultString;
    root.activeRecord.callToActionLine2 = root.defaultString;
    root.activeRecord.shortNameUsed = root.defaultShortNameUsage;
    root.activeRecord.shortName = root.defaultString;

    root.activeRecord.id = 0;
    root.activeRecord.shortNameIsUsed = true;

    root.clearQRCode();
    root.dataHasChanged = false;
    root.editingRecord = false;

  }

  displayHasNoData() : boolean {

    return ( this.activeRecord.displayName.length == 0) &&
           ( this.activeRecord.urlString.length == 0) &&
           ( this.activeRecord.callToActionLine1.length == 0) &&
           ( this.activeRecord.callToActionLine2.length == 0) && 
           ( this.activeRecord.shortNameUsed == this.defaultShortNameUsage ) &&
           ( this.activeRecord.openNewTab == this.deaultOpenNewTab )
           ;

  }

  updateRecordDisplay( root?: any ) : void {
    root = root || this;

    root.qrCodeGenerated = false;

    if (!!root.userRecords && !!root.userRecords.length ) {

      root.recordCount = root.newUserRecords.length;
      // root.table.renderRows();
  
    } else 
      console.log("Records undefined");

  }

  alreadyExistsInDatabase( text: string ) : boolean {

    return false;

  }

  addQRCode() : void {
    //
    // At this point, do not validate any data.  Add the record, as-is.
    //
    this.activeRecord.backgroundName = this.defaultBackgroundName;
    this.activeRecord.userID = this.userID;
    this.activeRecord.dateCreated = JSON.stringify( new Date() ) ;
    this.activeRecord.dateLastModified = JSON.stringify( new Date() );
    this.activeRecord.validUntil = JSON.stringify( this.determineRecordDuration() );
    this.activeRecord.shortName = this.defaultString;
  //  deserialized = new Date(JSON.parse(serialized));
    if ( this.activeRecord.shortNameUsed ) {
      this.saveNewShortName( 0, this.createUserRecord ); // Updon completion, createUserRecord will be called
    } else {
      this.createUserRecord(this.activeRecord, this);    
    }

    
  }

  saveNewShortName( depth: number, finalOperation: Function, root?: any ) {
    root = root || this;

    if ( depth++ < root.maxRecursionDepth ) {

      let newRecord = { ...this.activeRecord } as QRC_Record;
      newRecord.shortName = root.generateShortName();
      root.dataService.createKeyRecord( newRecord.shortName)
        .subscribe( status => {
          if ( status == root.dataService.storageMessage_duplicateRecordErrror) {
            root.saveNewShortName(depth, finalOperation, root);
          } else if ( status == root.dataService.storageMessage_unknownError ) {
            console.log("Unknown error storing record");
          } else {
            //
            // to get here, the save must have worked.
            //
            root.activeRecord.shortName = newRecord.shortName;
            finalOperation(root.activeRecord, root);
          }
        });
      // root.firebase.createTranslationPair( newRecord, root.dontUpdate ).subscribe( status => {
      //   if (status == root.firebase.storageMessage_duplicateRecordErrror ) {
      //     root.saveNewShortName(depth, finalOperation, root );
      //   }
      //   else if (status == root.firebase.storageMessage_unknownError ) {
      //     console.log("Unknown error storing record");
      //   } else {
      //     //
      //     // to get here, the save must have worked.
      //     //
      //     root.activeRecord.shortName = newRecord.shortName;
      //     finalOperation( root.activeRecord, root );
      //   }

      // });
    } else {
      console.log("Failed to find a new key");
    }

  }

  createUserRecord( record: QRC_Record, root: any ) {
    root = root || this;

    //
    // Creation of new record should return the record
    // with a completed ID.
    //
  
    // root.dataService.createUserRecord(root.activeRecord)
    //   .subscribe((record: QRC_Record) => {
    //     // Add the new record to the record list
    //     root.newUserRecords.push(record);
    //     root.updateRecordDisplay( root );
    //     root.clearActiveRecord( root );

    //   });    

    // if (!!root.firebaseKey) {

//      console.log("Creating user record");
//      root.firebase.createUserRecord(root.activeRecord, root.firebaseKey);
      root.dataService.createUserRecord(root.activeRecord )
        .subscribe( result => {

          //
          // Lazy error handling, because an error should have been logged previously
          //
          let error = result['error'];
          if (!!error)
            return; 

          result = result['data'];

          root.newUserRecords.push(result);
          root.recordCount = root.newUserRecords.length;
          root.table.renderRows();
          //
          // Just in case the user has changed any value for the short name
          //
          if (root.activeRecord.shortNameUsed && (root.activeRecord.shortName.length == 0)) {
            let newShortName = this.generateShortName();
            root.dataService.createKeyRecord( newShortName )
              .subscribe(result => {
                if ( result == this.dataService.storageMessage_duplicateRecordErrror ){
                  console.log("Duplicate shortname generated");
                } else if ( result == this.dataService.storageMessage_unknownError) {
                  console.log("Unknown error");
                } else if ( result == this.dataService.storageMessage_success) {
                  root.newUserRecords.shortName = newShortName;
                } else {
                  console.log("Unknown error");
                }
              });
          }
          root.clearActiveRecord();

        });

    // } else {
    //   console.log("Create User Record: Firebase key not defined");
    // }

  }

  getRecordByID( id: number ) : QRC_Record {

//    let recordArray = this.newUserRecords.filter(record => record.firebaseID == id);
    let recordArray = this.newUserRecords.filter(record => record.id == id);
    if ( recordArray.length > 1 )  // we should really throw an error and die
      console.log("OOOpppsss.... more than one record with the same id!!");
    else if ( recordArray.length == 0 )
      console.log("Record with id : " + id + " was not found ");
    
    return recordArray[0];
  }

  requestRecordUpdate() {
    
    this.updateRecord( this.activeRecord, this);

  }

  updateRecord( record: QRC_Record, root?: any ) {
    root = root || this;
    // if (!root.firebaseKey) {
    //   console.log("Update Record - Firebasekey not defined");
    // }
    //
    // If we are supposed to use a shortname, but one has not been created for it yet, we make a new short name before
    // the record is updated
    //
    if ( record.shortNameUsed && !record.shortName) {
      root.saveNewShortName(0, root.updateRecord, root);
    } else {

      debugger;  
      //
      // Update the shortname information if it is used
      if ( root.activeRecord.shortNameUsed && !root.activeRecord.shortName ) {  
        root.saveNewShortName(0, root.updateRecord, root);
        //root.firebase.createTranslationPair( root.activeRecord, root.updateIfFound );
      }
      //      root.firebase.updateRecord(root.activeRecord, root.firebaseKey);
      root.dataService.updateRecord(root.activeRecord)
        .subscribe(result => {
          let error = result['error'];
          if (!!error) {
            console.log("Error updating record : " + error);
          } else {
            //
            // The database is successfully updated, so update the local records
            //
            //      let recordToUpdate = root.getRecordByID(root.activeRecord.firebaseID)
            let recordToUpdate = root.getRecordByID(root.activeRecord.id)
            //
            // We don't track what has changed, so just update all possible records.
            //
            recordToUpdate.displayName = root.activeRecord.displayName;
            recordToUpdate.openNewTab = root.activeRecord.openNewTab;
            recordToUpdate.urlString = root.activeRecord.urlString;
            recordToUpdate.headerLanguage = root.activeRecord.headerLanguage;
            recordToUpdate.callToActionLine1 = root.activeRecord.callToActionLine1;
            recordToUpdate.callToActionLine2 = root.activeRecord.callToActionLine2;
            recordToUpdate.shortNameUsed = root.activeRecord.shortNameUsed;
            recordToUpdate.shortName = root.activeRecord.shortName;
            recordToUpdate.dateLastModified = JSON.stringify(new Date());

            root.clearActiveRecord(root);

          }

        });


    }

  }

  getLanguage( shortName: string ) {

    return this.headerLanguages.find( lang => lang.shortName == shortName )

  }

  editRecord ( id: number ) {
    //
    // Clone the record, don't just point to it
    // Otherwise, erasing the display will do "bad things"
    //    
    let recordToClone = this.getRecordByID( id ) ;
    this.activeRecord = { ...recordToClone }; // clone
    this.originalRecord = { ...recordToClone }; 

    this.activeRecord.shortNameUsed = recordToClone.shortNameUsed; // booleans aren't cloning well for some reason
    this.originalRecord.shortNameUsed = recordToClone.shortNameUsed;

    this.activeRecord.openNewTab = recordToClone.openNewTab;
    this.originalRecord.openNewTab = recordToClone.openNewTab;
    this.openNewTab = this.activeRecord.openNewTab; // kludge, kludge, kludge

    this.selectedHeaderLanguage = this.activeRecord.headerLanguage;

    if ( !!this.activeRecord.headerLanguage ) {

      this.changeLanguage( this.getLanguage( this.activeRecord.headerLanguage ))

    }

    if ( !!this.qrcode ) {

      if (this.activeRecord.shortNameUsed && !!this.activeRecord.shortName) {
        this.makeQRCode( this.activeRecord.shortName );
      }
      else if (!this.activeRecord.shortNameUsed && !!this.activeRecord.urlString) {
        this.makeQRCode( this.activeRecord.urlString );
      }
      else {
        this.clearQRCode();
      }

    }

    this.editingRecord = true;
    this.dataHasChanged = false;

  }

  deleteRecord(id: number) {
    //
    // Confirm the deletion.  Once this is done, delete the record
    // in the online database.  When this is successful, delete
    // the record locally. 
    //
    // if (!this.firebaseKey) {

    //   console.log("Delete Record - Firebasekey not defined");

    // } else 
    if (confirm(this.messageDeleteConfirmation_Part1 + this.getRecordByID(id).displayName + this.messageDeleteConfirmation_Part2)) {
      //
      // We have to delete the firebase record first, as it depends
      // upon the SQL record
      //      
//       let fbRecord = this.newUserRecords.find( record => record.id == id );
//       if ( !!fbRecord ) {
// //        this.firebase.deleteRecord(this.firebaseKey, fbRecord);
//         this.dataService.deleteSQLRecord(fbRecord.id).subscribe( record => {
//           console.log("Record " + record.id + " deleted");
//         });
//         this.newUserRecords = this.newUserRecords.filter(record =>
//           record.id != id);
//       }
      
//      this.table.renderRows();
 
      this.dataService.deleteSQLRecord(id)
        .subscribe(() => {
          this.newUserRecords = this.newUserRecords.filter(record =>
            record.id != id);
          this.recordCount = this.newUserRecords.length;
          this.clearActiveRecord();
        });
    }

  }

}
