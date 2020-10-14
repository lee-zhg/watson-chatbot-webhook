var ibmdb = require('ibm_db');


// Retrieve event information by searching the shortname
 function fetchEventByShortname(dsn, promotionName) {
    try {
       var conn=ibmdb.openSync(dsn);
       // Search for exact match only, could be extended with lIKE
       var data=conn.querySync("select shortname, location, begindate, enddate, link from promotions where shortname like ? fetch first 10 rows only", [promotionName]);
       conn.closeSync();
       
       var resString="Data: \n";
       for (var i=0;i<data.length;i++) {
         resString+="Description: "+data[i]['SHORTNAME']+" location: "+data[i]['LOCATION']+" info: "+data[i]['LINK']+" Start: "+data[i]['BEGINDATE']+" End: "+data[i]['ENDDATE']+"\n";
       }
       // Return both generated string and data
       return {result : resString, data : data, input: promotionName};
    } catch (e) {
        return { dberror : e }
    }
   }
   

// Retrieve event information by searching the dates
 function fetchEventByDates(dsn, promotionDate) {
    try {
       var conn=ibmdb.openSync(dsn);
       // Base data is timestamp
       var data=conn.querySync("select shortname, location, begindate, enddate, link from promotions where begindate <= ? and enddate >= ?", [promotionDate, promotionDate]);
       conn.closeSync();
       var resString="Data: \n";
       for (var i=0;i<data.length;i++) {
         resString+="Description: "+data[i]['SHORTNAME']+" location: "+data[i]['LOCATION']+" info: "+data[i]['LINK']+" Start: "+data[i]['BEGINDATE']+" End: "+data[i]['ENDDATE']+"\n"
       }
       // Return both generated string and data
       return {result: resString, data: data, input: promotionDate};
    } catch (e) {
        return { dberror : e }
    }
   }

// Insert a new event record
 function insertEvent(dsn, promotionValues) {
    try {
       var conn=ibmdb.openSync(dsn);
       // The timestamp value is derived from date and time values passed in
       var data=conn.querySync("insert into promotions(shortname, location, begindate, enddate, link) values(?,?,timestamp_format(?||' '||?,'YYYY-MM-DD HH24:MI:SS'),timestamp_format(?||' '||?,'YYYY-MM-DD HH24:MI:SS'),?)", promotionValues);
       conn.closeSync();
       return {result: data, input: promotionValues};
    } catch (e) {
        return { dberror : e }
    }
   }
   

function main(params) {
    dsn=params.__bx_creds[Object.keys(params.__bx_creds)[0]].dsn;

    switch(params.actionname) {
        case "insert":
            return insertEvent(dsn,params.promotionValues.split(","));
        case "searchByDates":
            return fetchEventByDates(dsn,params.promotionDate);
        case "searchByName":
            return fetchEventByShortname(dsn,params.promotionName);
        default:
            return { dberror: "No action defined", actionname: params.actionname}
    }
}
