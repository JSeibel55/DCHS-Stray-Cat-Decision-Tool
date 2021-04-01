var dateAssessed = 1,
    intakeType = 2,
    riskLevel = 3,
    streetAddress = 4,
    city = 5,
    zipCode = 6,
    state = 7,
    county = 8,
    latitude = 9,
    longitude = 10;

function append() {
    var params = {
      // The ID of the spreadsheet to update.
      spreadsheetId: config.spreadsheetId,  // TODO: Update placeholder value.

      // The A1 notation of a range to search for a logical table of data.
      // Values will be appended after the last row of the table.
      range: 'Sheet1',  // TODO: Update placeholder value.

      // How the input data should be interpreted.
      valueInputOption: 'USER_ENTERED',  // TODO: Update placeholder value.
      
      // How the input data should be inserted.
      insertDataOption: 'INSERT_ROWS',  // TODO: Update placeholder value.
    };

    var valueRangeBody = {
      // TODO: Add desired properties to the request body.
        "majorDimension": "ROWS",
        "values": [
          [
            dateAssessed,
            intakeType,
            riskLevel,
            streetAddress,
            city,
            zipCode,
            state,
            county,
            latitude,
            longitude
          ]
        ]
    };

    var request = gapi.client.sheets.spreadsheets.values.append(params, valueRangeBody);
    request.then(function(response) {
      // TODO: Change code below to process the `response` object:
      console.log(response.result);
    }, function(reason) {
      console.error('error: ' + reason.result.error.message);
    });
  }

function initClient() {
    var API_KEY = 'AIzaSyCIn5QKQ5Lrxori6s3JdOa6HrMaZ-V2csQ';  // TODO: Update placeholder with desired API key.

    var CLIENT_ID = '932350423623-67h32k723eilu87sltovvk5reklceb6g.apps.googleusercontent.com';  // TODO: Update placeholder with desired client ID.

    // TODO: Authorize using one of the following scopes:
    //   'https://www.googleapis.com/auth/drive'
    //   'https://www.googleapis.com/auth/drive.file'
    //   'https://www.googleapis.com/auth/drive.readonly'
    //   'https://www.googleapis.com/auth/spreadsheets'
    //   'https://www.googleapis.com/auth/spreadsheets.readonly'
    var SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

    gapi.client.init({
        'apiKey': config.API_KEY,
        'clientId': config.CLIENT_ID,
        'scope': SCOPE,
        'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    }).then(function() {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus);
        updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn);

    });
}

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function updateSignInStatus(isSignedIn) {
    if (isSignedIn) {
        $(".saveCatBtn").css("display", "block");
    }
}

function handleSignInClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

function handleSignOutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}