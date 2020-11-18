/**
 *
 * main() will be run when you invoke this action
 *
 * @param Cloud Functions actions accept a single parameter, which must be a JSON object.
 *
 * @return The output of this action, which must be a JSON object.
 *
 */
var request = require("request-promise");
const DiscoveryV1 = require("watson-developer-cloud/discovery/v1");

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

const statesMap = {
  alaska: "99501:US",
  alabama: "35801:US",
  arkansas: "72201:US",
  american_samoa: "96799:US",
  arizona: "85001:US",
  california: "90001:US",
  colorado: "80201:US",
  connecticut: "06101:US",
  district_of_columbia: "20001:US",
  delaware: "19901:US",
  florida: "33124:US",
  georgia: "30301:US",
  guam: "GU:US",
  hawaii: "96801:US",
  iowa: "50301:US",
  idaho: "83254:US",
  illinois: "60601:US",
  indiana: "46201:US",
  kansas: "67201:US",
  kentucky: "41701:US",
  louisiana: "70112:US",
  massachusetts: "02101:US",
  maryland: "21201:US",
  maine: "04032:US",
  michigan: "49036:US",
  minnesota: "55801:US",
  missouri: "63101:US",
  mississippi: "39530:US",
  montana: "59044:US",
  north_carolina: "27565:US",
  north_dakota: "58282:US",
  nebraska: "68901:US",
  new_hampshire: "03217:US",
  new_jersey: "07450:US",
  new_mexico: "87500:US",
  nevada: "89501:US",
  new_york: "10001:US",
  ohio: "44101:US",
  oklahoma: "74101:US",
  oregon: "74101:US",
  pennsylvania: "15201:US",
  puerto_rico: "00600:US",
  rhode_island: "02840:US",
  south_carolina: "29020:US",
  south_dakota: "57401:US",
  tennessee: "37201:US",
  texas: "78701:US",
  utah: "84321:US",
  virginia: "24517:US",
  virgin_islands: "00801:US",
  vermont: "05751:US",
  washington: "98004:US",
  wisconsin: "53201:US",
  west_virginia: "25813:US",
  wyoming: "82941:US",
};

function formatStates(state) {
  state = state.toLowerCase();
  state = state.replace(" ", "_");
  return state;
}

async function main(params) {

  // retrieve data by calling COVID-19 API
  if (params.type === "api") {
    try {
      const summary = await request({
        method: "GET",
        uri: "https://api.covid19api.com/summary",
        json: true,
      });

      if (params.location) {
        // country was the old param, could be states in us.
        state = formatStates(params.location);
        if (state in statesMap) {
          const uri = `https://api.weather.com/v3/wx/disease/tracker/state/60day?postalKey=${statesMap[state]}&format=json&apiKey=${params.twcApiKey}`;

          const data = await request({
            method: "GET",
            uri: uri,
            json: true,
          });

          return {
            result: `Total Cases: ${data.covid19.confirmed[0]}\nTotal Deaths: ${data.covid19.deaths[0]}\n\nSource: ${data.covid19.source[0]}`,
          };
        }
        for (var i = 0; i < summary.Countries.length; i++) {
          if (
            summary.Countries[i].Country.toLowerCase() ===
              params.location.toLowerCase() ||
            summary.Countries[i].CountryCode.toLowerCase() ===
              params.location.toLowerCase()
          ) {
            return {
              result: `Total Cases: ${summary.Countries[i].TotalConfirmed}\nTotal Deaths: ${summary.Countries[i].TotalDeaths}\nTotal Recovered: ${summary.Countries[i].TotalRecovered}\n\nSource: Johns Hopkins CSSE`,
            };
          }
        }
        return { error: "did not find location" };
      }
      let totalCases = summary.Global.TotalConfirmed;
      let totalDeaths = summary.Global.TotalDeaths;
      let totalRecovered = summary.Global.TotalRecovered;

      return {
        result: `Total Cases: ${totalCases}\nTotal Deaths: ${totalDeaths}\nTotal Recovered: ${totalRecovered}\n\nSource: Johns Hopkins CSSE`,
      };
    } catch (err) {
      return { error: "it failed : " + err };
    }

  // retrieve data from Watson Discovery
  } else if (params.type === "discovery") {
    const discovery = new DiscoveryV1({
      version: "2019-03-25",
      iam_apikey: params.api_key,
      url: params.url,
    });

    const offset = 0;

    const queryParams = {
      environment_id: params.env_id,
      collection_id: params.collection_id,
      natural_language_query:
        params.input,
      count: 3,
      offset: offset,
    };
    try {
      data = await discovery.query(queryParams);
      let response = data.results.map((v, i) => {
        return `Promotion: ${v.desc},
                Promotion Location: ${v.location},
                Start Date: ${v.begindate}
                End Date: ${v.enddate}
                Coupon Link: ${v.link} <br><br>`;
      });
      return {
        result:
          "Here are available specials: <br><br>" +
          response.join("\n\n"),
      };
    } catch (err) {
      return { error: "it failed : " + err };
    }
  
  // retrieve data from DB2
  } else if (params.type === "db2") {
    var ibmdb = require('ibm_db');
    dsn=params.__bx_creds[Object.keys(params.__bx_creds)[0]].dsn;
  
    // dsn does not exist in the DB2 credential for Standard instance. It must be built manually
    if(!dsn) {
      const dbname = params.__bx_creds[Object.keys(params.__bx_creds)[0]].connection.db2.database;
      const hostname = params.__bx_creds[Object.keys(params.__bx_creds)[0]].connection.db2.hosts[0].hostname;
      const port = params.__bx_creds[Object.keys(params.__bx_creds)[0]].connection.db2.hosts[0].port;
      const protocol = 'TCPIP';
      const uid = params.__bx_creds[Object.keys(params.__bx_creds)[0]].connection.db2.authentication.username;
      const password = params.__bx_creds[Object.keys(params.__bx_creds)[0]].connection.db2.authentication.password;
      
      //dsn="DATABASE=;HOSTNAME=;PORT=;PROTOCOL=;UID=;PWD=;Security=SSL";
      dsn = `DATABASE=${dbname};HOSTNAME=${hostname};PORT=${port};PROTOCOL=${protocol};UID=${uid};PWD=${password};Security=SSL`;
      //console.log(`manually created DSN string: '' - NOTE: REMOVE THIS LOG LINE, AS IT LOGS CREDENTIALS`);
      //console.log(dsn);
    }

    try {
      var ibmdb = require('ibm_db');
      var conn=ibmdb.openSync(dsn);
      
      // searching parameter
      var x = params.input;
      if (x != null && x != ""){
        x = "%" + x + "%";
      }else{
          var x = "%";
      }
      
      var data=conn.querySync("select SHORTNAME from prom.promotions where SHORTNAME like ?", [x]);

      // format data retrieved
      const count = data.length;
      var i;
      var outp = "Here are available specials: <br><br>";
      for (i=0; i<count; i++){
        outp += (i+1) + ") " + data[i].SHORTNAME + "<br>";
      }

      conn.closeSync();
      return {result : outp};

    } catch (err) {
      return { error: "it failed : " + err };
    }
  } else {
    return { error: "invalid type: can only be api, discovery and db"};
  }
}
