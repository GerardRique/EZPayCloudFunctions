import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const cors = require("cors")({ origin: true });

admin.initializeApp();
// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const getBarcodeDetails = functions.https.onRequest(
  (request, response) => {
    const barcodeNumber = request.query.barcodeId;

    return admin
      .database()
      .ref("Barcodes/" + barcodeNumber)
      .once("value", snapshot => {
        if (snapshot.val() !== null) {
          const data = snapshot.val();
          response.send(data);
        } else response.send('{"message": "Invalid Barcode Number"}');
      })
      .catch(error => {
        response.send(error);
      });
  }
);

export const getTransactionsCustomerId = functions.https.onRequest(
  (request, response) => {
    const customerId = request.query.customerId;

    const customerRef = admin
      .database()
      .ref()
      .child("Transaction")
      .orderByChild("customerId")
      .equalTo(customerId);

    return customerRef
      .once("value", snapshot => {
        if (snapshot.val() !== null) {
          const data = snapshot.val();
          response.send(data);
        } else response.send('{"message": "Invalid customer Id"}');
      })
      .catch(error => {
        response.send(error);
      });
  }
);

export const getTransactionsMerchantId = functions.https.onRequest(
  (request, response) => {
    const merchantId = request.query.merchantId;

    const merchantRef = admin
      .database()
      .ref()
      .child("Transaction")
      .orderByChild("merchantId")
      .equalTo(merchantId);

    return merchantRef
      .once("value", snapshot => {
        if (snapshot.val() !== null) {
          const data = snapshot.val();
          response.send(data);
        } else response.send('{"message": "Invalid Merchant Id"}');
      })
      .catch(error => {
        response.send('{"message": "Invalid customer Id"}');
      });
  }
);

export const addInvoice = functions.https.onRequest((request, response) => {
  const category = request.body.category;
  const title = request.body.title;
  const location = request.body.location;
  const price = request.body.price;
  const description = request.body.description;
  const merchantId = request.body.merchantId;
  const img = request.body.img;

  const barcodeRef = admin.database().ref("Barcodes");
  const dateCreatedimestamp = new Date().getTime();
  const invoiceData = {
    title: title,
    category: category,
    merchantId: merchantId,
    description: description,
    price: price,
    location: location,
    dateCreated: dateCreatedimestamp,
    imgUrl: img
  };

  return barcodeRef.push(invoiceData).then(result => {
    const resultString = "" + result;
    const result_split = resultString.split("/");
    const invoiceId = result_split.pop();
    barcodeRef
      .child(invoiceId + "/id")
      .set(invoiceId)
      .then(invoiceResult => {
        response.send(
          '{"type": "success", "message": "Successfully added new invoice"}'
        );
      })
      .catch(error => {
        console.log(error);
        response.send(
          '{"type": "error", "message": "Error adding new transaction"}'
        );
      });
  });
});

export const makePurchase = functions.https.onRequest((request, response) => {
  const barcodeNumber = request.query.barcodeNumber;
  const customerId = request.query.customerId;
  const status = request.query.status;

  const barcodeRef = admin.database().ref("Barcodes/" + barcodeNumber);
  const transactionRef = admin.database().ref("Transaction");
  return barcodeRef
    .once("value", snapshot => {
      if (snapshot.val() !== null) {
        const transactionTimestamp = new Date().getTime();
        const transactionData = {
          customerId: customerId,
          timestamp: transactionTimestamp,
          merchantId: snapshot.val().merchantId,
          invoiceNumber: barcodeNumber,
          status: status
        };
        transactionRef.push(transactionData).then(result => {
          const resultString = "" + result;
          const result_split = resultString.split("/");
          const transactionId = result_split.pop();
          transactionRef
            .child(transactionId + "/id")
            .set(transactionId)
            .then(transactionIdresult => {
              response.send(
                '{"type": "success", "message": "Successfully added new transaction"}'
              );
            })
            .catch(error => {
              response.send(
                '{"type": "error", "message": "Error adding new transaction"}'
              );
            });
        });
      } else
        response.send(
          '{"type": "error", "message": "Error adding new transaction"}'
        );
    })
    .catch(error => {
      console.log(error);
      response.send(
        '{"type": "error", "message": "Error adding new transaction"}'
      );
    });
});

export const createNewMerchant = functions.https.onRequest(
  (request, response) => {
    cors(request, response, () => {
      const userData = {
        email: request.body.email,
        name: request.body.name,
        paypalId: request.body.paypalId,
        password: request.body.password,
        id: ""
      };
      admin
        .auth()
        .createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.name
        })
        .then(function(userRecord) {
          console.log(
            "Successfully created new firebase user:",
            userRecord.uid
          );
          userData.id = userRecord.uid;
          admin
            .database()
            .ref("Users/Merchants")
            .child(userData.id)
            .set(userData)
            .then(result => {
              console.log("Successfully created user with ID: " + userData.id);
              response.send(
                '{"status": 0, "message": "You account has been successfully created, ' +
                  userData.name +
                  '"}'
              );
            })
            .catch(error => {
              console.log(error);
              response.send(
                '{"status": 1, "message": "Error creating account"}'
              );
            });
        })
        .catch(function(error) {
          response.send('{"status": 1, "message": "' + error + '"}');
        });
    });
  }
);

export const createNewCustomer = functions.https.onRequest(
  (request, response) => {
    const id = request.query.id;
    const email = request.query.email;
    const name = request.query.name;

    const userData = {
      email: email,
      name: name,
      id: id
    };

    admin
      .database()
      .ref("Users/Customers")
      .child(id)
      .set(userData)
      .then(result => {
        console.log("Successfully created customer with ID: " + id);
        response.send(
          '{"type": "success", "message": "Successfully created new customer with ID ' +
            id +
            '"}'
        );
      })
      .catch(error => {
        response.send(
          '{"type": "error", "message": "Error creating customer"}'
        );
      });
  }
);
