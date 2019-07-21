import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore'
import { AngularFireAuthModule } from '@angular/fire/auth';
import { environment } from '../environments/environment';

import { AppComponent } from './app.component';
import { MaterialModule } from './material.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DataService } from './data.service';
import { AuthService } from './auth.service';
import { RestAPIService } from './rest-api.service';
import { WindowService } from './window.service';
import { QrcodeDialogComponent } from './qrcode-dialog/qrcode-dialog.component';
import { MatInputModule } from '@angular/material';

import { QRCodeModule } from 'angularx-qrcode';
import { CallToActionDirective } from './call-to-action.directive';
import { auth } from 'firebase';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    QrcodeDialogComponent,
    CallToActionDirective,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule,
    FlexLayoutModule,
    HttpClientModule,
    FormsModule,
    MatInputModule,
    QRCodeModule,
    AngularFireModule.initializeApp( environment.firebase ),
    AngularFirestoreModule,
    AngularFireAuthModule,
  ],
  
  exports:[
    MaterialModule
  ],

  entryComponents: [ QrcodeDialogComponent ],
  providers: [ 
    DataService, 
    AuthService,
    RestAPIService, 
    WindowService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
