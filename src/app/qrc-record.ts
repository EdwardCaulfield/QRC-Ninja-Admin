
export interface QRC_Record {
    id: number,              // The ID that SQL assigned
    firebaseID: string,         // The ID that Firebase assigned
    userID: number,             // The username has bad characters for the SQL search, so let's just have an id
    displayName: string,        // So the user can identify the QR Code
    openNewTab: any,            // should we open a new tab when navigating to the decoded QR Code?
    urlString: string,          // the QR Code will decode to this value
    shortNameUsed: any,         // Is a shortname to be used?
    shortName: string,          // If the QR Code is a shortname
    backgroundName: string,     // Name of the background
    headerLanguage: string,           // Language of the header text
    callToActionLine1: string,  // Call to action strings
    callToActionLine2: string,
    dateCreated: string,
    dateLastModified: string,
    validUntil: string
}