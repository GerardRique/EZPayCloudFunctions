import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const cors = require("cors")({ origin: true });

admin.initializeApp();
// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const getInvoiceDetails = functions.https.onRequest(
  (request, response) => {
    const invoiceId = request.query.invoiceId;

    return admin
      .database()
      .ref("Invoices/" + invoiceId)
      .once("value", snapshot => {
        if (snapshot.val() !== null) {
          const data = snapshot.val();
          response.send(data);
        } else response.send('{"message": "Invalid Invoice Id"}');
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

export const getTransactionsByMerchantId = functions.https.onRequest(
  (request, response) => {
    cors(request, response, () => {
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
          } else response.send('{"status":1, "message": "Invalid Merchant Id"}');
        })
        .catch(error => {
          response.send('{"status":1, "message": "'+ error +'"}');
        });
    })
  }
);

export const getMerchantInvoices = functions.https.onRequest(
  (request, response) => {
    cors(request, response, () => {
      const merchantId = request.query.id;

      const merchantRef = admin
        .database()
        .ref()
        .child("Invoices")
        .orderByChild("merchantId")
        .equalTo(merchantId);

      return merchantRef
        .once("value", snapshot => {
          if (snapshot.val() !== null) {
            const data = snapshot.val();
            response.send(data);
          } else response.send('{"status": 1 , "message": "Invalid Merchant Id"}');
        })
        .catch(error => {
          response.send('{"status": 1, "message": "Invalid Merchant Id"}');
        });
    })
  }
);

export const addInvoice = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    const category = request.body.category;
    const title = request.body.title;
    const location = request.body.location;
    const price = request.body.price;
    const description = request.body.description;
    const merchantId = request.body.merchantId;
    const imgUrl = request.body.imgUrl;

    const InvoiceRef = admin.database().ref("Invoices");
    const dateCreatedimestamp = new Date().getTime();
    const invoiceData = {
      title: title,
      category: category,
      merchantId: merchantId,
      description: description,
      price: price,
      location: location,
      dateCreated: dateCreatedimestamp,
      imgUrl: imgUrl
    };

    return InvoiceRef.push(invoiceData).then(result => {
      const resultString = "" + result;
      const result_split = resultString.split("/");
      const invoiceId = result_split.pop();
      InvoiceRef
        .child(invoiceId + "/id")
        .set(invoiceId)
        .then(invoiceResult => {
          response.send(
            '{"type": "success", "message": "' + invoiceId + '"}'
          );
        })
        .catch(error => {
          console.log(error);
          response.send(
            '{"type": "error", "message": "Error adding new invoice"}'
          );
        });
    });
  })
});


export const addTransaction = functions.https.onRequest((request, response) => {
  const invoiceId = request.query.invoiceId;
  const customerId = request.query.customerId;
  const status = request.query.status;
  const customerName = request.query.customerName;

  const InvoiceRef = admin.database().ref("Invoices/" + invoiceId);
  const transactionRef = admin.database().ref("Transaction");
  const invoiceNumber = "INV" + Math.floor(10000 + Math.random() * 90000);
  return InvoiceRef
    .once("value", snapshot => {
      if (snapshot.val() !== null) {
        const transactionTimestamp = new Date().getTime();
        const transactionData = {
          customerId: customerId,
          customerName: customerName,
          transactionDate: transactionTimestamp,
          invoiceNumber: invoiceNumber,
          status: status,
          invoice: snapshot.val(),
          merchantId: snapshot.val().merchantId
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
                '{"status": 1, "message": "Successfully added new transaction"}'
              );
            })
            .catch(error => {
              response.send(
                '{"status": 1, "message": "Error adding new transaction"}'
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

      const merchantId = "MERCH" + Math.floor(10000 + Math.random() * 90000);

      admin
        .auth()
        .createUser({
          email: request.body.email,
          password: request.body.password,
          displayName: request.body.name,
          uid: merchantId
        })
        .then(function (userRecord) {
          console.log(
            "Successfully created new firebase user:",
            userRecord.uid
          );
          const userData = {
            email: request.body.email,
            name: request.body.name,
            paypalId: request.body.paypalId,
            id: merchantId
          };
          admin
            .database()
            .ref("Users/Merchants")
            .child(merchantId)
            .set(userData)
            .then(result => {
              console.log("Successfully created user with ID: " + merchantId);
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
        .catch(function (error) {
          response.send('{"status": 1, "message": "' + error + '"}');
        });
    });
  }
);

export const createNewCustomer = functions.https.onRequest(
  (request, response) => {
    const email = request.query.email;
    const name = request.query.name;
    const password = request.query.password;

    const customerId = "CUS" + Math.floor(10000 + Math.random() * 90000);


    return admin.
      auth().
      createUser({
        email: email,
        password: password,
        displayName: name,
        uid: customerId,
        disabled: false
      })
      .then((userRecord) => {
        console.log(
          "Successfully created new firebase user:",
          userRecord.uid
        );
        const userData = {
          email: email,
          name: name,
          id: customerId
        };

        admin
        .database()
        .ref("Users/Customers")
        .child(customerId)
        .set(userData)
        .then(result => {
          console.log("Successfully created customer with ID: " + customerId);
          response.send(
            '{"status": 0, "message": "Successfully created new customer with ID ' +
            customerId +
            '", "id": ' + 
            customerId + '}'
          );
        })
        .catch(error => {
          response.send(
            '{"status": 1, "message": "Error creating customer"}'
          );
        });
      }).catch((error) => {
        response.send('{"status": 1. "message": "'+ error +'"}');
      });
  }
);


export const getMerchant = functions.https.onRequest(
  (request, response) => {
    cors(request, response, () => {
      const id = request.query.id;
      return admin
        .database()
        .ref("Users/Merchants/" + id)
        .once("value", snapshot => {
          if (snapshot.val() !== null) {
            const data = snapshot.val();
            response.send(data);
          } else response.send('{"staus":1, "message": "Unable to retrieve merchant"}');
        })
        .catch(error => {
          response.send(error);
        });
    })
  }
);

export const getMerchants = functions.https.onRequest(
  (request, response) => {
    return admin
    .database()
    .ref("Users/Merchants")
    .once("value", (snapshot) => {
      if(snapshot.val() !== null){
        const data = snapshot.val();
        response.send(data);
      }
      else response.send('{"staus": 1, "message": "Unable to retrieve merchants"}')
    })
    .catch((error) => {
      response.send('{"staus": 1, "message": "'+ error +'"}');
    });
  }
)

export const topSellingProduct = functions.https.onRequest(
  (request, response) => {
    cors(request, response, () => {
      const merchantId = request.query.merchantId;
      const merchantTransactionRef = admin
      .database()
      .ref()
      .child("Transaction")
      .orderByChild("merchantId")
      .equalTo(merchantId);
      

      return merchantTransactionRef
      .once("value", (snapshot) => {
        const data: any = {};
        if(snapshot.val() !== null){
          snapshot.forEach((transaction) => { 
            if(transaction.val().invoice.title in data){
              data[transaction.val().invoice.title] += 1;
            }
            else data[transaction.val().invoice.title] = 1;
          })
          response.send(data);
        }
        else response.send('{"staus": 1, "message": "No merchants match the given ID"}')
      }).catch((error) => {
        response.send('{"staus": 1, "message": "'+ error +'"}');
      })
    })
  }
);

export const transactionsByMonth = functions.https.onRequest(
  (request, response) => {
    cors(request, response, () => {
      const merchantId = request.query.merchantId;
      const merchantTransactionRef = admin
      .database()
      .ref()
      .child("Transaction")
      .orderByChild("merchantId")
      .equalTo(merchantId);

      return merchantTransactionRef
      .once("value", (snapshot) => {
        const months: Array<number> = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        if(snapshot.val() != null){
          snapshot.forEach((transaction) => {
            let current = new Date(transaction.val().transactionDate);
            months[current.getMonth()] += 1;
          });
          response.send(months);
        }
        else response.send('{"staus": 1, "message": "No merchants match the given ID"}')
      }).catch((error) => {
        response.send('{"staus": 1, "message": "'+ error +'"}');
      });

    })
  }
)