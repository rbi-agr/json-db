const express = require('express');
const app = express();
const PORT = 3001;

const DEFAULT_ACCOUNT = "SB-111111111";

const formatDate = (date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear().toString();
    return `${d}${m}${y}`;
};

const parseDDMMYYYY = (str) => {
    const day = parseInt(str.slice(0, 2), 10);
    const month = parseInt(str.slice(2, 4), 10) - 1;
    const year = parseInt(str.slice(4), 10);
    return new Date(year, month, day);
};

const activityTypes = [
    "Excess wdl charges",
    "ATM AMC CHGS",
    "Cash handling charges",
    "ATM WDL CHARGES",
    "MIN BAL CHGS"
];

const accountList = ["001105001001", "502000159753", "100230145789"];

const generateTransactionsForDate = (accountNumber, date) => {
    const formattedDate = formatDate(date);
    const transactions = [];
    const transactionCount = Math.floor(Math.random() * 4) + 5;

    for (let i = 0; i < transactionCount; i++) {
        const activity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        const excessCharge = Math.floor(Math.random() * (700 - 100 + 1)) + 100;

        transactions.push({
            Account_Number: accountNumber,
            Valid_Date: formattedDate,
            Post_Date: formattedDate,
            Transaction_Type: "DR",
            Narration: `${activity}`,
            Amount: excessCharge.toFixed(2)
        });
    }

    return transactions;
};


const generateTransactionsForDateRange = (startDate, endDate) => {
    const allTransactions = [];
    let currentDate = new Date(startDate);  

    while (currentDate <= endDate) {
        for (const acc of accountList) {
            
            const txns = generateTransactionsForDate(acc, new Date(currentDate.getTime()));
            allTransactions.push(...txns);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return allTransactions;
};

app.use(express.json());

app.post(['/statement/v1/eq-dtxn-chrg', '/statement/v1/eq-ltxn-chrg'], (req, res) => {
    let { Account_Number, From_Date, To_Date } = req.body;
    console.log(From_Date)
    console.log(To_Date)
    
    const today = new Date();
    const defaultToDate = today;
    const defaultFromDate = new Date(today);
    defaultFromDate.setDate(today.getDate() - 6); // past 7 days

    const fromDateObj = From_Date ? parseDDMMYYYY(From_Date) : defaultFromDate;
    const toDateObj = To_Date ? parseDDMMYYYY(To_Date) : defaultToDate;

    // Ensure time is set to 00:00:00 for comparison
    fromDateObj.setHours(0, 0, 0, 0);
    toDateObj.setHours(23, 59, 59, 999);
    defaultFromDate.setHours(0, 0, 0, 0);
    defaultToDate.setHours(23, 59, 59, 999);


    // Validate date range
    if (
        fromDateObj < defaultFromDate ||
        toDateObj > defaultToDate ||
        fromDateObj > toDateObj
    ) {
        return res.json({
            "MainStatement_Response": {
                "metaData": {
                    "status": {
                        "code": "400",
                        "desc": "Data only available for the past 7 days and within a valid date range."
                    }
                }
            }
        });
    }

    const allTransactions = generateTransactionsForDateRange(fromDateObj, toDateObj);
    Account_Number = Account_Number.toString()
    // Filter by Account Number
    let filteredTransactions = Account_Number
        ? allTransactions.filter(txn => txn.Account_Number === Account_Number)
        : allTransactions;

    
    const limit = Math.floor(Math.random() * 2) + 3; // 3 or 4
    const shuffled = filteredTransactions.sort(() => 0.5 - Math.random());
    const limitedTransactions = shuffled.slice(0, limit);
    // const limitedTransactions = filteredTransactions.slice(0, limit);
    console.log(limitedTransactions)
    res.json({
        "MainStatement_Response": {
            "metaData": {
                "status": {
                    "code": "200",
                    "desc": "Success"
                }
            },
            "Body": {
                "Payload": {
                    "Collection": limitedTransactions
                }
            }
        }
    });
});


// Route 1: /statement/v1/eq-dtxn-chrg or /statement/v1/eq-ltxn-chrg
// app.post(['/statement/v1/eq-dtxn-chrg', '/statement/v1/eq-ltxn-chrg'], (req, res) => {
//     res.json({
//         "MainStatement_Response": {
//                 "metaData": {
//                     "status": {
//                         "code": "200",
//                         "desc": "Success"
//                     }
//                 },
//                 "Body": {
//                     "Payload": {
//                         "Collection": [{
//                             "Valid_Date": "13032024",
//                             "Post_Date": "13032024",
//                             "Transaction_Type": "DR",
//                             "Narration": "Excess wdl charges",
//                             "Amount": "300.000"
//                         }, {
//                             "Valid_Date": "13032024",
//                             "Post_Date": "13032024",
//                             "Transaction_Type": "DR",
//                             "Narration": "ATM AMC CHGS",
//                             "Amount": "118.000"
//                         }, {
//                             "Valid_Date": "14032024",
//                             "Post_Date": "14032024",
//                             "Transaction_Type": "DR",
//                             "Narration": "Cash handling charges",
//                             "Amount": "1000.000"
//                         }, {
//                             "Valid_Date": "14032024",
//                             "Post_Date": "14032024",
//                             "Transaction_Type": "DR",
//                             "Narration": "ATM WDL CHARGES",
//                             "Amount": "14.000"
//                         }, {
//                             "Valid_Date": "14032024",
//                             "Post_Date": "14032024",
//                             "Transaction_Type": "DR",
//                             "Narration": "MIN BAL CHGS",
//                             "Amount": "36.000"
//                         }]
//                     }
//                 }
//             }
//     });
// });

// Route 2: /chatbot/v1/ct-complaint-cgrs
app.post('/chatbot/v1/ct-complaint-cgrs', (req, res) => {
    res.json({
        "CGRSRegistration_Response": {
                "metadata": {
                    "status": {
                        "Code": "200", 
                        "Desc": "Success"
                    }
                },
                "Body": {
                    "Payload": {
                        "data": {
                            "Request_Date_and_Time": "12\/03\/2024",
                            "Customer_Account_Number": "XXXXXX6849",
                            "Ticket_Number": "10776100",
                            "Status_desc": "Y",
                            "status": "",
                            "status_detail": ""
                            }
                        }
                    }
                }
    });
});

// Route 3: /enquiry/v1/eq-ln-dtl
app.post('/enquiry/v1/eq-ln-dtl', (req, res) => {
    res.json({
       "LoanAcctEnq_Response": {
            "metaData": {
                "status": {
                    "code": "200",
                    "desc": "Success"
                }
            },
            "Body": {
                "Payload": {
                    "Real_Int": "42233.00",
                    "Account_Number": "7455601957",
                    "Account_currency": "INR",
                    "Status": "FULL",
                    "Branch_Number": "01491",
                    "Account_Type_Desc": "SVL-4W-OFFICERS-FIXED",
                    "Account_Type": "3702",
                    "Int_Cat": "0008",
                    "Term": "180",
                    "Loan_Type": "0000",
                    "Discharge_Ref": "",
                    "Rem_Repay": "171",
                    "Account_Name": "SRIRAM R",
                    "Customer_Name": "Mr. SRIRAM R",
                    "GL_Classification_Code": "01491INR6341505082",
                    "Appl": "800000.00",
                    "Bal": "766219.49",
                    "Apprvd": "800000.00",
                    "Advd": "800000.00",
                    "Commi": "0.00",
                    "Unearn": "0.00",
                    "Earn": "0.00",
                    "Repay": "7408.00",
                    "Arr/Adv": "9341.51-",
                    "Npb": "723986.49",
                    "Li_Acc": "833.10000",
                    "Bpi_Acc": ".00000",
                    "Ciac": ".00000",
                    "Li_Inc": "138.84672",
                    "Bpi_Inc": ".00000",
                    "Ciin": ".00000",
                    "Add_Loan": "0",
                    "Int_Rate": "07.0000",
                    "No_Int": "0.00",
                    "Lst_Arr_Dte": "06012024",
                    "Repayment_Rate": "07.0000",
                    "P_Y_Ytd_Int": "2148.00",
                    "Approval_Date": "18032023",
                    "Last_Fin_Date": "31122023",
                    "Last_Maint_Date": "15032023",
                    "Last_Adv_Date": "18032023",
                    "Intrest_Reset_Date": "18032023",
                    "Repayment_Type": "00000",
                    "Pend_Dues_Date": "07012024",
                    "Pen_Due": "7408.00",
                    "System_Tracked_IRAC_Status": "00",
                    "C_Y_Ytd_Int": "40085.00",
                    "Dwn_Pay": "0.00",
                    "Theo": "775561.00",
                    "Int_Prepay_Strt": "",
                    "Int_Prepay_Exp": "",
                    "I_P_Amt": "",
                    "Stmnt_Freq": "Y",
                    "Stmnt_Cyc": "01",
                    "Stmnt_Day": "00",
                    "Re_Draw_Ind": "",
                    "Ar_Acc": ".00000",
                    "Ar_Inc": ".00000",
                    "Booking_No": "",
                    "Act_Type_Chg": "99999999",
                    "Re_Draw": "0.00",
                    "Arr_Acc": ".00000",
                    "Term_Basis": "M",
                    "Drawing_Amount": "800000.00",
                    "Security_Amount": "940400.00",
                    "TL_Review_Date": "99999999",
                    "Credit_Rating_Code": "",
                    "Uipytx": "2148.00",
                    "INCA": "0.00",
                    "Actual_IRAC_Status": "00",
                    "Subsidy_Status": "6",
                    "Subvention_End_Date": "00000000",
                    "SMA_Status": "N"
                }
            }
        }
    });
});

// Route 4: /cheque-service/v1/eq-chkbk-sts
app.post('/cheque-service/v1/eq-chkbk-sts', (req, res) => {
    res.json({
        "ChequeBookTracking_Response": {
              "metadata": {
                "status": {
                  "Code": "200",
                  "Desc": "Success"
                }
              },
              "Body": {
                "Payload": {
                  "Status": "SUCCESS",
                  "Message": "",
                  "TrackingList": [{
                    "Name": "Saurabh Dalmia",
                    "TrackingID": "AX254201394IN",
                    "BookingDate": "22/02/2023"
                  }]
                }
              }
            }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
