import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth'
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})

export class AuthService {

  private isLoggedIn = false;

  constructor( public afAuth: AngularFireAuth ) {

//    this.isLoggedIn = afAuth.auth.currentUser == null ? false : true;

   }

  userIsLoggedIn() {

    return true;
//    return this.isLoggedIn;

  }
  doGoogleLogout() {

//    this.afAuth.auth.signOut();

  }

  getAuthorizationState() {

//    return this.afAuth.auth.currentUser;

  }

  doGoogleLogin() {

    return new Promise<any>( (resolve, reject) => {

      let provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      this.isLoggedIn = false;

      this.afAuth.auth
        .signInWithPopup( provider )
        .then( result => {
          this.isLoggedIn = true;
          resolve( result );
        });
    });
  }
}
