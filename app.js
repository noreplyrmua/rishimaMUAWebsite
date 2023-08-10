//=============================to make this version run locally, we need normal fs, not cyclic fs
require('dotenv').config();
const bodyParser = require("body-parser");
const express = require("express");
const ejs = require("ejs");
const port = process.env.PORT || 9000;
const app = express();
const mongoose = require('mongoose');
const _ = require('lodash');
const fs = require('@cyclic.sh/s3fs');
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
// const { writeFileSync, readFileSync } = require("fs");
const moment = require('moment');
const nodemailer = require('nodemailer');
const aws = require('aws-sdk');


app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.locals._ = _;

var warningMessage = "";
var noOfFields = 0;
var clientIDForInvoice = "" 
const connectDB = async () => {
    try {
      const conn = await mongoose.connect("mongodb+srv://" + process.env.ATLASUSERNAME + ":" + process.env.ATLASPSWD+ "@cluster0.dlgrzgj.mongodb.net/RMUA_DB", {useNewUrlParser : true});
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  }

const invoiceTableSchema = new mongoose.Schema({
    dateofBooking : Date,
    description : String,
    qty : Number,
    price : Number
});

const invoiceSchema = new mongoose.Schema({
    srNo : Number,
    issueDate : Date,
    invoiceTable : [invoiceTableSchema],
    totalPrice : Number,
    discount : Number,
    advance : Number,
    balance : Number,
    clientContact : Number,
    finalPrice : Number //after discount


});

const enquiryDetails = new mongoose.Schema({
    fullName : String,
    email : String,
    waNumber : Number,
    instaID : String,
    bookingDate : Date,
    locationType : String,
    serviceType : Array,
    customMessage : String,
    completedStatus : {type : String, default : 'no'},
    invoice : invoiceSchema
});

const Enquiry = new mongoose.model("Enquiry", enquiryDetails);
const InvoiceTable = new mongoose.model("Invoice-Table", invoiceTableSchema);
const Invoice = new mongoose.model("Invoice", invoiceSchema);
 
//basic get requests

app.get("/", function(req, res){
    res.render("index", {
        pageTitle : "Rishima Makeup Artist"
    });
});

app.get("/index", function(req, res){
    res.redirect("/");
});

app.get("/aboutRishima", function(req, res){
    res.render("aboutRishima", {
         pageTitle : "About Rishima"
    });
});

app.get("/gallery", function(req, res){
    res.render("gallery", {
        pageTitle : "Gallery"
    });
});

app.get("/services", function(req, res){
    res.render("services", {
        pageTitle : "Services"
    });
});

app.get("/getInTouch", function(req, res){
    res.render("getInTouch", {
        pageTitle : "Get In Touch",
        warningMessage : warningMessage
    });
    warningMessage = "";
});

app.get("/thankyou", function(req, res){
    res.render("thankyou",{
        pageTitle : "Thank you!"
    });
});

app.get("/astrosutopia", function(req, res){
    res.render("adminLogin", {
        pageTitle : "Admin Login",
        warningMessage : ""
    });
});

//==================================================== POSTS

app.post("/getInTouch", function(req, res){

    globalThis.singleEnquiry = new Enquiry;
    if (req.body.outofstation === "on" && req.body.studio === "on"){
        console.log("Both selected");
        warningMessage = "*Please select only one type of location"
        res.render("getInTouch", {
            pageTitle : "Get in Touch",
            warningMessage : warningMessage
        });
    } else if (req.body.outofstation === "on"){
        singleEnquiry.locationType = "out of station";
        singleEnquiry.fullName = req.body.name;
        singleEnquiry.email=req.body.email
        singleEnquiry.waNumber=req.body.pnumber
        singleEnquiry.instaID=req.body.instaID
        singleEnquiry.bookingDate=req.body.bookDate
        singleEnquiry.customMessage=req.body.message

        

        makeupTypeArray = [];

        if (req.body.bridal === "on"){
            makeupTypeArray.push("bridal");
        } if (req.body.preWeddingFunctions === "on"){
            makeupTypeArray.push("pre-wedding");
        } if (req.body.partyMakeUp === "on"){
            makeupTypeArray.push("party-makeup");
        } if (req.body.editorial === "on"){
            makeupTypeArray.push("editorial");
        } if (req.body.specialEffects === "on"){
            makeupTypeArray.push("SFX");
        }

        singleEnquiry.serviceType = makeupTypeArray;

        singleEnquiry.save();
        res.redirect("thankyou")
    } else if (req.body.studio === "on") {
        singleEnquiry.locationType = "studio";
        singleEnquiry.fullName = req.body.name;
        singleEnquiry.email=req.body.email
        singleEnquiry.waNumber=req.body.pnumber
        singleEnquiry.instaID=req.body.instaID
        singleEnquiry.bookingDate=req.body.bookDate
        singleEnquiry.customMessage=req.body.message

        

        makeupTypeArray = [];

        if (req.body.bridal === "on"){
            makeupTypeArray.push("bridal");
        } if (req.body.preWeddingFunctions === "on"){
            makeupTypeArray.push("pre-wedding");
        } if (req.body.partyMakeUp === "on"){
            makeupTypeArray.push("party-makeup");
        } if (req.body.editorial === "on"){
            makeupTypeArray.push("editorial");
        } if (req.body.specialEffects === "on"){
            makeupTypeArray.push("SFX");
        }

        singleEnquiry.serviceType = makeupTypeArray;

        singleEnquiry.save();
        res.redirect("thankyou");
    }
});

app.post("/astrosutopia", function(req, res){
    if (process.env.ADMINPASSWORD === req.body.adminPassword){
        console.log("Access Granted");
        console.log("Fetching client data...");
        Enquiry.find({}).sort({bookingDate : 1}).then(foundItems => {
            console.log("items found");
            console.log(foundItems);
            res.render("adminConsole", {
                pageTitle : "Admin Console",
                clients : foundItems,
            });
        })
    } else {
        res.render("adminLogin", {
            pageTitle : "Admin Access",
            warningMessage : "Password is incorrect"
        });
    }
});
    
app.post("/deleteEntry", function(req, res){
    Enquiry.deleteOne({ _id : req.body.deleteObjectID }).then(function(){
        console.log("Data deleted"); // Success
        Enquiry.find({}).sort({bookingDate : 1}).then(foundItems =>{
            res.render("adminConsole", {
                pageTitle : "Admin Console",
                clients : foundItems
            });
        });
    }).catch(function(error){
        console.log(error); // Failure
    });
});

app.post("/expandEntry", function(req, res){
    const objectID = req.body.expandObjectID;
    // Enquiry.find({_id : objectID})
});

app.post("/completedStatus", function(req, res){
    Enquiry.updateOne({_id : req.body.completedStatusID}, {completedStatus : "yes"}).then(()=>{
        Enquiry.find({}).sort({bookingDate : 1}).then(foundItems =>{
            res.render("adminConsole", {
                pageTitle : "Admin Console",
                clients : foundItems
            });
        }); 
    });
    
    
});

app.post("/showCompleted", function(req, res){
    Enquiry.find({completedStatus : 'yes'}).sort({bookingDate : 1}).then(foundItems=>{
        res.render("adminConsole",{
            pageTitle : "Admin Console",
            clients : foundItems
        });
    });
});

app.post("/showIncomplete", function(req, res){
    Enquiry.find({completedStatus : 'no'}).sort({bookingDate : 1}).then(foundItems=>{
        res.render("adminConsole",{
            pageTitle : "Admin Console",
            clients : foundItems
        });
    });
});

app.post("/showAll", function(req, res){
    Enquiry.find({}).sort({bookingDate : 1}).then(foundItems=>{
        res.render("adminConsole",{
            pageTitle : "Admin Console",
            clients : foundItems
        });
    });
});

app.post("/generateInvoice", function(req, res){
    noOfFields = req.body.noOfFields;
    clientIDForInvoice = req.body.clientIDForInvoice;
    console.log(clientIDForInvoice);
    Enquiry.find({_id : req.body.clientIDForInvoice}).then(foundItem => {
        // console.log(foundItem.fullName);
        res.render("invoiceData", {
            fullName : foundItem.fullName,
            pageTitle : "Generate Invoice",
            noOfFields : noOfFields
    });
    });
    
    // createPDF().catch((err) => console.log(err));
});

app.post("/invoiceData", function(req, res){
    var totalPrice = 0;
    Enquiry.findOneAndUpdate({_id : clientIDForInvoice}, {}).then(foundItem => {
        const instanceOfInvoice = new Invoice;

        if (Number(noOfFields) === 1){
            const instanceOfInvoiceTable = new InvoiceTable;
            instanceOfInvoiceTable.dateofBooking = req.body.dateOfBooking;
            instanceOfInvoiceTable.dateofBooking = instanceOfInvoiceTable.dateofBooking.toLocaleDateString("en-GB", {'day' : 'numeric', 'month' : 'numeric', 'year' : 'numeric'});
            instanceOfInvoiceTable.description = req.body.description;
            instanceOfInvoiceTable.qty = req.body.quantity;
            instanceOfInvoiceTable.price = req.body.price;
            totalPrice = totalPrice + Number(req.body.quantity) * Number(req.body.price);
            instanceOfInvoice.invoiceTable.push(instanceOfInvoiceTable);
            var discount = Number(req.body.discount/100);
            instanceOfInvoice.discount = discount;
            instanceOfInvoice.advance = req.body.advance;
            instanceOfInvoice.totalPrice = totalPrice;
            instanceOfInvoice.clientContact = foundItem.waNumber;
            instanceOfInvoice.finalPrice = totalPrice - totalPrice * discount;
            instanceOfInvoice.balance = instanceOfInvoice.finalPrice - req.body.advance;
            instanceOfInvoice.issueDate = istDate();
            // foundItem.invoice.srNo = 
            foundItem.invoice = instanceOfInvoice;
            createPDF(instanceOfInvoice, foundItem.fullName);
            foundItem.save();
            
        } else {
            for (i = 0; i < noOfFields; i++){
                const instanceOfInvoiceTable = new InvoiceTable;
                instanceOfInvoiceTable.dateofBooking = req.body.dateOfBooking[i];
                // instanceOfInvoiceTable.dateofBooking = instanceOfInvoiceTable.dateofBooking.toLocaleDateString("en-GB", {'day' : 'numeric', 'month' : 'numeric', 'year' : 'numeric'});
                instanceOfInvoiceTable.description = req.body.description[i];
                instanceOfInvoiceTable.qty = req.body.quantity[i];
                instanceOfInvoiceTable.price = req.body.price[i];
                totalPrice = totalPrice + Number(req.body.quantity[i]) * Number(req.body.price[i]);
                instanceOfInvoice.invoiceTable.push(instanceOfInvoiceTable);
            }
            var discount = Number(req.body.discount/100);
            instanceOfInvoice.discount = discount;
            instanceOfInvoice.advance = req.body.advance;
            instanceOfInvoice.totalPrice = totalPrice;
            instanceOfInvoice.clientContact = foundItem.waNumber;
            instanceOfInvoice.finalPrice = totalPrice - totalPrice * discount;
            instanceOfInvoice.balance = instanceOfInvoice.finalPrice - req.body.advance;
            instanceOfInvoice.issueDate = istDate();
            // foundItem.invoice.srNo = 
            foundItem.invoice = instanceOfInvoice;
            createPDF(instanceOfInvoice, foundItem.fullName);
            foundItem.save();
            
        }

        //custom email sending function starts here
        async function main(){

            const emails = [process.env.INVOICE_RECEIVING_EMAIL, foundItem.email]; //array of emails to which mail will be sent
            const plainText = "Greetings " + foundItem.fullName + "!\nThank you for letting us help you look the prettiest on your special day. Attached below is the invoice.\n\n\nRegards,\nRishima";
            const transporter = nodemailer.createTransport({
                host : 'smtp.gmail.com',
                port : 465,
                secure : true,
                auth : {
                    user : process.env.EMAIL,
                    pass : process.env.EMAILPASSWORD
                }
            });
        
            const info = await transporter.sendMail({
                from : 'Rishima MUA <' + process.env.EMAIL + '>',
                to : emails,
                subject : 'Invoice',
                text : plainText, 
                attachments : [{
                    filename : foundItem.fullName + '_invoice.pdf',
                    path : './' + foundItem.fullName + '_invoice.pdf',
                    // cid: '' this option is to embed a document in an email
                }] //array of objects. each object relates to one attachment
            })
            console.log(info.rejected);
            if (info.rejected.length === 0){
                res.render("invoiceSent", {
                    pageTitle : "email confirmation",
                    statusOfClient : "fa-solid fa-check fa-fade",
                    statusOfAdmin : "fa-solid fa-check fa-fade",
                    extraMessage : "All emails sent successfully!"
                });
            } else if (info.rejected.length === 1){
                if (info.rejected[0] === process.env.INVOICE_RECEIVING_EMAIL){
                    res.render("invoiceSent", {
                        pageTitle : "email confirmation",
                        statusOfClient : "fa-solid fa-check fa-fade",
                        statusOfAdmin : "fa-solid fa-x fa-shake",
                        extraMessage : "Try checking Admin email and creating invoice again"
                    });
                } else {
                    res.render("invoiceSent", {
                        pageTitle : "email confirmation",
                        statusOfAdmin : "fa-solid fa-check fa-fade",
                        statusOfClient : "fa-solid fa-x fa-shake",
                        extraMessage : "Try checking client email and creating invoice again"
                    });
                }
            } else if (info.rejected.length === 2){
                res.render("invoiceSent", {
                    pageTitle : "email confirmation",
                    statusOfAdmin : "fa-solid fa-x fa-shake",
                    statusOfClient : "fa-solid fa-x fa-shake",
                    extraMessage : "Try checking both admin and client email and creating invoice again"
                });
            }
            fs.unlink("./" + foundItem.fullName + '_invoice.pdf', function (err) {
                if (err) {
                  console.error(err);
                } else {
                  console.log("File removed");
                }
              });
        }

        main().catch(e=>{console.log(e)});

        
        

    });
    

    
});

connectDB().then(() => {
    app.listen(port, () => {
        console.log("listening for requests");
    })
})

function istDate(){
    var currentTime = new Date();

    var currentOffset = currentTime.getTimezoneOffset();

    var ISTOffset = 330;   // IST offset UTC +5:30 

    var ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset)*60000);
    // ISTTime = ISTTime.toLocaleDateString("en-GB", {'day' : 'numeric', 'month' : 'numeric', 'year' : 'numeric', 'weekday' : 'long'});
    return ISTTime;
}
async function createPDF(invoice, name) {
    const document = await PDFDocument.load(fs.readFileSync("./invoice_layout.pdf"));
  
    const courierBoldFont = await document.embedFont(StandardFonts.Courier);
    const firstPage = document.getPage(0);
  
    //serialNumber
    // firstPage.moveTo(125, 684);
    // firstPage.drawText("", {
    //   font : courierBoldFont,
    //   size : 12
    // });
  
    //issued date
    firstPage.moveTo(59, 623);
    firstPage.drawText(moment(invoice.issueDate).format('dddd, DD/MM/YYYY'), {
      font: courierBoldFont,
      size: 12,
    });
  
    //Actual content
    var sx = 65;
    var sy = 500;
    var px = sx;
    var py = sy;

    var dateStringArray = [];
    for (j = 0; j < invoice.invoiceTable.length; j++){
        dateStringArray.push(moment(invoice.invoiceTable[j].dateofBooking).format('DD/MM/YYYY'));
    }
    
    var i = 0;
    invoice.invoiceTable.forEach((element)=>{
  
      firstPage.moveTo(px, py);
      firstPage.drawText(dateStringArray[i], {
          font : courierBoldFont,
          size : 8
      });
      i++;
      px = px + 60;
      firstPage.moveTo(px, py);
      firstPage.drawText(element.description, {
          font : courierBoldFont,
          size : 12
      });
      px = px + 200
      firstPage.moveTo(px, py);
      firstPage.drawText(String(element.qty), {
          font : courierBoldFont,
          size : 12
      });
      px = px + 50
      firstPage.moveTo(px, py);
      firstPage.drawText(String(element.price), {
          font : courierBoldFont,
          size : 12
      });
  
      py = py - 25;
      px = sx;
  
  
    });
  
    if (invoice.discount > 0){
        firstPage.moveTo(125, 310);
        firstPage.drawText("Discount", {
          font : courierBoldFont,
          size : 12
        });

        const discountString = String(invoice.discount*100) + "%";
        firstPage.moveTo(375, 310);
        firstPage.drawText(discountString, {
          font : courierBoldFont,
          size : 12
        });
    }
  
    firstPage.moveTo(450, 280);
    firstPage.drawText(String(invoice.finalPrice), {
      font : courierBoldFont,
      size : 14
    });
  
    firstPage.moveTo(132, 243);
    firstPage.drawText(String(invoice.advance), {
      font : courierBoldFont,
      size : 12
    });
  
    firstPage.moveTo(132, 228);
    firstPage.drawText(String(invoice.balance), {
      font : courierBoldFont,
      size : 12
    });

    firstPage.moveTo(59, 90);
    firstPage.drawText(String(invoice.clientContact), {
        font : courierBoldFont,
        size : 12
    });
  
  
  
    fs.writeFileSync(name + "_invoice.pdf", await document.save());
  }