# Automatically set up services and actions for tutorial on
# Database-backed Slackbot with Watson Assistant (conversation)
if [ -z "$2" ]; then 
              echo usage: $0 theSecret DB_SERVICE
              exit
fi
theSecret="$1"
DB_SERVICE="$2"

# create an IAM namespace
ibmcloud fn namespace create chatbot-promotion --description "namespace for Promotion tutorial"

# set the new namespace as default
ibmcloud fn property set --namespace chatbot-promotion

# create package
ibmcloud fn package create chatbot-promotion-pkg

# Cloud function used by the chatbot
# create action for setup using Node.js environment
ibmcloud  fn  action  create  chatbot-promotion-pkg/controller  controller.js  --kind nodejs:10  --param-file  controller_parameters.json  --web  true  --web-secure  $theSecret

# bind action to Db2 credentials
ibmcloud fn service bind $DB_SERVICE chatbot-promotion-pkg/controller  --instance promotionDB

# Cloud function for setup DB2
# create action for setup using Node.js environment
ibmcloud fn action create chatbot-promotion-pkg/db2Setup db2-setup.js  --kind nodejs:10

# bind action to Db2 credentials
ibmcloud fn service bind $DB_SERVICE chatbot-promotion-pkg/db2Setup  --instance promotionDB

# invoke actions to create table, then insert sample data
ibmcloud fn action invoke chatbot-promotion-pkg/db2Setup -p mode "[\"setup\"]" -r
ibmcloud fn action invoke chatbot-promotion-pkg/db2Setup -p mode "[\"sampledata\"]" -r