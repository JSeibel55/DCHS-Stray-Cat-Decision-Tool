// Google Sheets API functions

// Append a row of new data to the bottom of the Google Sheet
function append(dateAssessed, intakeType, riskLevel, streetAddress, city, zipCode, state, county) {
  var params = {
    // The ID of the spreadsheet to update.
    spreadsheetId: '1L-O4XFF3SPQChxfyqeevAhyi1hZV_atNXfzArlbhlNo',  // TODO: Update placeholder value.

    // The A1 notation of a range to search for a logical table of data.
    // Values will be appended after the last row of the table.
    range: 'Data',  // TODO: Update placeholder value.

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
          catLatitude,
          catLongitude
        ]
      ]
  };

  var request = gapi.client.sheets.spreadsheets.values.append(params, valueRangeBody);
  request.then(function(response) {
    // TODO: Change code below to process the `response` object:
    // console.log(response.result);
    $('#save-cat-form').modal('hide');
    $('#submit-window').modal('show');

  }, function(reason) {
    console.error('error: ' + reason.result.error.message);
  });
}

function get() {
  var params = {
      // The ID of the spreadsheet to retrieve data from.
      spreadsheetId: '1L-O4XFF3SPQChxfyqeevAhyi1hZV_atNXfzArlbhlNo',  // TODO: Update placeholder value.

      // The A1 notation of the values to retrieve.
      range: 'Data',  // TODO: Update placeholder value.

      // How values should be represented in the output.
      // The default render option is ValueRenderOption.FORMATTED_VALUE.
      // valueRenderOption: '',  // TODO: Update placeholder value.

      // How dates, times, and durations should be represented in the output.
      // This is ignored if value_render_option is
      // FORMATTED_VALUE.
      // The default dateTime render option is [DateTimeRenderOption.SERIAL_NUMBER].
      // dateTimeRenderOption: '',  // TODO: Update placeholder value.
  };

  var request = gapi.client.sheets.spreadsheets.values.get(params);
  request.then(function(response) {
      // TODO: Change code below to process the `response` object:
      // console.log(response.result.values);
      arrayToJSONObject(response.result.values);

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
      'apiKey': API_KEY,
      'clientId': CLIENT_ID,
      'scope': SCOPE,
      'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
  }).then(function() {
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus);
      updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
  });
}

function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

function updateSignInStatus(isSignedIn) {
  if (isSignedIn) {
    get();
    addPastCatToggle();
  }
}

function handleSignInClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

function handleSignOutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}
