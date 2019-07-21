import { Injectable  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map  } from 'rxjs/operators';

import { WindowService } from './window.service';

@Injectable({
  providedIn: 'root',
})

export class RestAPIService {

  private api_url: any;
  private nonce = "";
  private userID: number;

  constructor( private win: WindowService, private http: HttpClient ) { 

    this.api_url = ( this.win.nativeWindow.api_Settings ) ? this.win.nativeWindow.api_Settings.root + 'wp/v2/' :
    'http://localhost:8080/wordpress/wp-json/wp/v2/';

    this.nonce = ( this.win.nativeWindow.api_Settings ) ? this.win.nativeWindow.api_Settings.nonce : '';
  }


  saveUserID( id: number ) : void {
    this.userID = id;
  }

  retrieveUserID() : number {

      return this.userID;
  }
  
  getUserID() : Observable<any> {

    //  If there is no nonce, then we are on a test system
    if ( this.nonce.length == 0) {
      console.log("Missing nonce!!");
      return of([]);
    }
    else
      return this.http.get( this.api_url + 'users/me?_wpnonce=' + this.nonce).pipe( map( (res) => {
        this.userID = res['id'];
        return res;
      }));

  }
}
