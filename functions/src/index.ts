import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp()
// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript


export const getBarcodeDetails = functions.https.onRequest((request, response) => {
    const barcodeNumber = request.query.barcodeId;

    return admin.database().ref('Barcodes/' + barcodeNumber).once('value', (snapshot) => {
        if(snapshot.val() !== null){
            const data = snapshot.val();
            response.send(data);
        }
        else  response.send('{"message": "Invalid Barcode Number"}')
        
    }).catch((error) => {
        response.send(error)
    })
})

export const getTransactionsCustomerId = functions.https.onRequest((request, response) => {
    const customerId = request.query.customerId;

    const customerRef =  admin.database().ref().child('Transactions').orderByChild('customerId').equalTo(customerId);

    return customerRef.once('value', (snapshot) => {
        if(snapshot.val() !== null){
            const data = snapshot.val();
            response.send(data);
        }
        else  response.send('{"message": "Invalid customer Id"}')
    }).catch((error) => {
        response.send(error)
    })
})

export const getTransactionsMerchantId = functions.https.onRequest((request, response) => {
    const merchantId = request.query.merchantId;

    const merchantRef = admin.database().ref().child('Transactions').orderByChild('merchantId').equalTo(merchantId);

    return merchantRef.once('value', (snapshot) => {
        if(snapshot.val() !== null){
            const data = snapshot.val();
            response.send(data);
        }
        else response.send('{"message": "Invalid Merchant Id"}')
    }).catch((error) => {
        response.send('{"message": "Invalid customer Id"}')
    })

})

export const makePurchase = functions.https.onRequest((request, response) => {
    const barcodeNumber = request.query.barcodeNumber;
    const customerId = request.query.customerId;

    const barcodeRef = admin.database().ref('Barcodes/' + barcodeNumber);
    const transactionRef = admin.database().ref('Transaction');
    return barcodeRef.once('value', (snapshot) => {
        if(snapshot.val() !== null){
            const transactionTimestamp = new Date().getTime();
            const transactionData = {
                'customerId': customerId,
                'timestamp' : transactionTimestamp,
                'invoiceNumber': barcodeNumber,
                'itemPurchased': snapshot.val()
            };
            transactionRef.push(transactionData).then((result) => {
                const resultString = '' + result
                const result_split = resultString.split('/');
                const transactionId = result_split.pop()
                transactionRef.child(transactionId + '/transactionId').set(transactionId).then((transactionIdresult) => {
                    response.send('{"type": "success", "message": "Successfully added new transaction"}');
                }).catch((error) => {
                    response.send('{"type": "error", "message": "Error adding new transaction"}');
                })
               
            })
        }
        else response.send('{"type": "error", "message": "Error adding new transaction"}');
    }).catch((error) => {
        console.log(error);
        response.send('{"type": "error", "message": "Error adding new transaction"}');
    })
})

export const createNewMerchant = functions.https.onRequest((request, response) => {
    const merchantEmail = request.query.email;
    const merchantPassword = request.query.password;
    const merchantName = request.query.name;
    //const merchantPaypalId = request.query.ppId;

    return admin.auth().createUser({
        email: merchantEmail,
        password: merchantPassword,
        displayName: merchantName,
        disabled: false
    }).then((userRecord) => {
        const userData = {
            'email': merchantEmail,
            'name': merchantName,
            'id': userRecord.uid
        };
        admin.database().ref('Users/Merchants').child(userRecord.uid).set(userData).then((result) => {
            console.log('Successfully created user with ID: ' + userRecord.uid);
            response.send('{"type": "success", "message": "Successfully created new merchant with ID '+userRecord.uid+'"}');
        }).catch((error) => {
            response.send('{"type": "error", "message": "Error creating user"}');
        })
    }).catch((error) => {
        console.log(error);
        response.send('{"type": "error", "message": "Error creating user"}');
    })
});

export const createNewCustomer = functions.https.onRequest((request, response) => {
    const email = request.query.email;
    const password = request.query.password;
    const name = request.query.username;

    return admin.auth().createUser({
        email: email,
        password: password,
        displayName: name,
        disabled: false
    }).then((userRecord) => {
        const userData = {
            'email': email,
            'name': name,
            'id': userRecord.uid
        };
        admin.database().ref('Users/Customers').child(userRecord.uid).set(userData).then((result) => {
            console.log('Successfully created customer with ID: ' + userRecord.uid);
            response.send('{"type": "success", "message": "Successfully created new customer with ID '+userRecord.uid+'"}');
        }).catch((error) => {
            response.send('{"type": "error", "message": "Error creating customer"}');
        })
    }).catch((error) => {
        console.log(error);
        response.send('{"type": "error", "message": "Error creating customer"}');
    })


})
