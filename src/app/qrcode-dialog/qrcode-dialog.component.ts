import { Component, EventEmitter, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { DataService } from '../data.service';
import { QRC_Record } from '../qrc-record';

@Component({
  selector: 'app-qrcode-dialog',
  templateUrl: './qrcode-dialog.component.html',
  styleUrls: ['./qrcode-dialog.component.scss']
})
export class QrcodeDialogComponent implements OnInit {

  qrCodeData = {
    displayName: '',
    urlString: '',
    shortNameUsed: false,
    callToActionLineA: '',
    callToActionLineB: '',
  };

  constructor( 
    public dialogRef: MatDialogRef<QrcodeDialogComponent>,
    @Inject( MAT_DIALOG_DATA ) public data: any,
    private elementRef: ElementRef,
    public dataService: DataService
    ) { 
      
      this.qrCodeData.callToActionLineA = data.callToActionLine1;
      this.qrCodeData.callToActionLineB = data.callToActionLine2;
      this.qrCodeData.displayName = data.displayName;
      this.qrCodeData.urlString = data.urlString;
      this.qrCodeData.shortNameUsed = data.shortNameUsed == "1" ? true : false;

    }


  ngOnInit() {

  }

  alphanumericPattern = "'^[a-zA-Z0-9 \'\-\!]+$'";
  urlPattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  lastIDUsed = 1;


  public event: EventEmitter<any> = new EventEmitter();

  onNoClick() : void {
    
    this.dialogRef.close();

  }

  lifeOfEntry = 100; // in years....
  onSubmit( ) : void {
    //
    // Once all the processing is done, the form will
    // need to be updated to reflect the change in records.  
    // Save the form information for later
    //
    const newData = {} as QRC_Record;
    console.log("saving data");
    newData.displayName = this.qrCodeData.displayName;
    newData.callToActionLine1 = this.qrCodeData.callToActionLineA;
    newData.callToActionLine2 = this.qrCodeData.callToActionLineB;
    newData.urlString = this.qrCodeData.urlString;
    newData.shortNameUsed = this.qrCodeData.shortNameUsed;

    console.log("Data has been saved");
    this.event.emit( { data: newData } );

    console.log("Closing dialog");
    this.dialogRef.close();

  }

  minNameLength = 1;
  maxNameLength = 30;
  validateName( name: string ) : boolean {

    name = name.trim();
    
    if ( name.match(this.alphanumericPattern) )
      return this.validateStringSize( name, this.minNameLength, this.maxNameLength );
    else
    return false;

  }

  minCallToActionLength = 1;
  maxCallToActionLength = 30;
  validateCallToAction( callToAction: string ) : boolean {
    
    callToAction = callToAction.trim();

    if ( callToAction.match(this.alphanumericPattern) ) 
      return this.validateStringSize( callToAction.trim(), this.minCallToActionLength, this.maxCallToActionLength );
    else
      return false;

  }

  validateURL( urlString: string ) : boolean  {

    let regexp = "(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?";
 //   return regexp.test(urlString);
    return this.urlPattern.test(urlString);

  }


  validateStringSize( str: string, minSize: number, maxSize: number ) : boolean {

    let stringLength = str.length;

    return (stringLength >= minSize) && (stringLength <= maxSize) ;

  }

}
