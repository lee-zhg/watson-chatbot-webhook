# Automatically set up services and actions for tutorial on
# Database-backed Slackbot with Watson Assistant (conversation)
if [ -z "$1" ]; then 
              echo usage: $0 theSecret
              exit
fi
theSecret="$1"


# create an IAM namespace
ibmcloud fn namespace create chatbot-promotion --description "namespace for Promotion tutorial"

# set the new namespace as default
ibmcloud fn property set --namespace chatbot-promotion

# create package
ibmcloud fn package create chatbot-promotion-pkg

# create action for setup using Node.js environment
ibmcloud  fn  action  create  chatbot-promotion-pkg/controller  controller.js  --kind nodejs:10  --param-file  controller_parameters.json  --web  true  --web-secure  $theSecret
