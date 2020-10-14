var ibmdb = require('ibm_db');
/**
  * Set up the necessary Db2 table, insert some data or clean up
  *
  * Written by Henrik Loeser
  */

function db2Setup(dsn, mode) {
 try {
    var tabledef="create table promotions "+
                 "(promotionid int not null generated always as identity (start with 1000, increment by 1),"+
                  "shortname varchar(255),"+
                  "location varchar(100),"+
                  "begindate timestamp,"+
                  "enddate timestamp,"+
                  "link varchar(255);";
    var sampledata="insert into promotions(shortname,location,begindate,enddate,link) values('Free small drink with purchase of any meal','','2020-10-01 00:00:00','2020-12-31 23:59:00','https://www.ibm.com/events/think/'),('Buy one hamburger and 1/2 price for the 2nd hamburger','Dallas','2020-06-01 00:00:00','2021-05-31 23:59:00','http://www.ibm.com');"
    var tabledrop="drop table promotions;"

    var conn=ibmdb.openSync(dsn);
    if (mode=="setup")
    {
        var data=conn.querySync(tabledef);
    } else if (mode=="sampledata")
    {
      var data=conn.querySync(sampledata);
    } else if (mode=="cleanup")
    {
      var data=conn.querySync(tabledrop);
    }
    conn.closeSync();
    return {result : data};
 } catch (e) {
     return { dberror : e }
 }
}

function main(params) {
  dsn=params.__bx_creds[Object.keys(params.__bx_creds)[0]].dsn;
	return db2Setup(dsn, params.mode);
}
