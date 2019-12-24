const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
var braintree = require("braintree");
var express = require('express');

var gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: MERCHANT_KEY,
  publicKey: PUBLIC_KEY,
  privateKey: PRIVATE_KEY
});

exports.createToken = functions.https.onCall(async (request, response) => {
  const customerID = request.customerID;
  console.log(customerID);

  return new Promise((resolve, reject) => {
    gateway.clientToken.generate({customerId: customerID}, function(err, response) {
      if (err) {
        console.log(err);
        reject(new Error('unknown', 'Error getting client nonce'));
      } else {
        console.log(`token: ${response.clientToken}`);
        resolve(response.clientToken);
      }
    })
  })
});

exports.createCustomer = functions.https.onCall(async (request, response) => {
  const firstName = request.firstName;
  const lastName = request.lastName;
  const email = request.email;
  console.log(email);

  return new Promise((resolve, reject) => {
    gateway.customer.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
    }, function(err, response) {
      if (err) {
        console.log(err);
        reject(new Error('unknown', 'Error creating user'));
      } else {
        //RETURN THESE TO CLIENT
        console.log(response.success);
        console.log(response.customer.id);

        var customerData = {"success" : response.success, "customerID" : response.customer.id};
        resolve(customerData);
      }
    })
  })
});

//TAKE OUT F
exports.makeTransaction = functions.https.onCall(async (request, response) => {
  const paymentMethodNonce = request.paymentMethodNonce;

  return new Promise ((resolve, reject) => {
    gateway.transaction.sale({
      amount: "10.00",
      paymentMethodNonce: paymentMethodNonce,
      options: {
        submitForSettlement: true
      }
    }, function (err, result) {
      if (result.success) {
        var transactionID = result.transaction.id;
        resolve (new Promise((resolve, reject) => {
          gateway.transaction.submitForSettlement(transactionID, function (err, result) {
            if (err !== null) {
              console.log(result.errors);
              resolve("ERROR MAKING TRANSACTION")
            } else {
              var settledTransaction = result.transaction;
              console.log("success");
              resolve("success")
            }
          });
        }));
      } else {
        resolve("ERROR MAKING TRANSACTION: " + err) 
      }
    });
  })
});
