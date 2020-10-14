# Watson Chatbot Webhook - Know what is on sales before ordering

In this tutorial, you are going to enhence the [Basic Burger Ordering Chatbot with Watson Assistant Service](https://github.com/lee-zhg/watson-chatbot-simple.git). You'll configure the chatbot to provide promotion information. 

Because the promotion information is very dynamic and changes frequently over time, it may not be practical to embed it as part of the chatbot. Promotion information can be stored externally, such as in a database or Watson Discovery. In this repo, you are going to enhence the chatbot to retrieve and communicate the promotion information stored in a DB2 database and/or Watson Discovery service.

!["Architecture"](doc/images/architecture03.png)

This repo is part of Watson chatbot serial. The entire serial includes
* [Simple ChatBot](https://github.com/lee-zhg/watson-chatbot-simple.git)
* [Dressed-up ChatBot](https://github.com/lee-zhg/watson-chatbot-advanced.git)
* [Voice-Enabled ChatBot](https://github.com/lee-zhg/watson-voice-enabled-chatbot.git)
* [VoiceBot – Call and speak to ChatBot](https://github.com/lee-zhg/watson-voicebot.git) 

> **NOTE**: Watson Assistant service is available in IBM Cloud as well as part of IBM Cloud pak for Data. As the result, you can deploy and run your chatbot in public cloud, private cloud, hybird cloud and on-prem.

> Click [here](https://www.ibm.com/products/cloud-pak-for-data) for more information about IBM Cloud Pak for Data.

Adopted from IBM code pattern [Build a database-driven Slackbot](https://github.com/IBM-Cloud/slack-chatbot-database-watson).


## Use Case Flow

1. User sends messages to the application (running locally or on IBM Cloud).
2. The application sends the user message to IBM Watson Assistant service, and displays the ongoing chat in a web page.
3. Watson Assistant uses the NLU and NLP to understand and fulfill your order, and sends requests for additional information back to the running application. Watson Assistant can be provisioned on either IBM Cloud or IBM Cloud Pak for Data.
4. Watson Assistant useds `web hook` to retrieve sales information dynamically from external sources such as DB2 database and Watson Discovery service.


## Included Components

* [IBM Watson Assistant](https://www.ibm.com/cloud/watson-assistant/): Build, test and deploy a bot or virtual agent across mobile devices, messaging platforms, or even on a physical robot.
* [IBM Watson DB2](https://cloud.ibm.com/catalog/services/db2): A fully managed, high-performant relational data store running the enterprise-class DB2 database engine.
* [IBM Watson Disacovery](https://cloud.ibm.com/catalog/services/discovery): Add a cognitive search and content analytics engine to applications.


## Exercise Flow

### Step 1 - Clone the repo

To clone `watson-chatbot-webhook` locally in a terminal, run:

```
$ git clone https://github.com/lee-zhg/watson-chatbot-webhook.git

$ cd watson-chatbot-webhook
```

We’ll be using the file [`data/skill-watson-burger-simple.json`](data/skill-watson-burger-advanced.json) to upload the Assistant Intents, Entities, and Dialog Nodes.


### Step 2 - Create Watson Assistant Service

If you have completed the exercise of [Basic Burger Ordering Chatbot with Watson Assistant Service](https://github.com/lee-zhg/watson-chatbot-simple.git), you should have created a `Watson Assistant` service instance in IBM Cloud. You may re-use the sample instance for the exercise in this repo.

In case you don't have a `Watson Assistant` service instance in IBM Cloud, create one and name it `burger-asssistant-service`:

* [**Watson Assistant**](https://cloud.ibm.com/catalog/services/conversation)


### Step 3 - Configure Watson Assistant

If you have completed the exercise of [Basic Burger Ordering Chatbot with Watson Assistant Service](https://github.com/lee-zhg/watson-chatbot-simple.git), you should have configured a `skill`. You may re-use the same `skill` for the exercise in this repo.

If you don't have a `skill` configured, you may import a `skill` definition that is used by the chatbot,

1. Login to [IBM Cloud](https://cloud.ibm.com).

1. On the dashboard, find and open your `Watson Assistant` service instance.

1. Click `Launch Watson Assistant` on the `Manage` tab.

1. Select the `Skills` tab in the left navigation tab.

1. Click `Create skill`.

1. Select the `Dialog skill` option and then click `Next`.

1. Go to the `Import skill` tab.

1. Click the link `Drag and drop file here or click to select a file`.

1. Go to your cloned repo dir, and `Open` file [`data/skill-watson-burger-simple.json`](data/skill-watson-burger-advanced.json).

1. Click `Import`.


### Step 4 - Create DB2 Service Instance

1. Login to IBM Cloud in the terminal environment.

   ```
   ibmcloud login 
   ```

   or

   ```
   ibmcloud login --sso
   ```

1. List your available resource groups.

   ```
   ibmcloud resource groups
   ```

1. Target the resource group where the `Cloud Function` will be configured.

   ```sh
   ibmcloud target -g RESOURCE_GROUP
   ```
   For example, top use the `default` resource group

   ```
   ibmcloud target -g default
   ```

1. Create a DB2 service instance in IBM Cloud of **us-south** region. And name it **promotionDB**.

   ```sh
   ibmcloud resource service-instance-create promotionDB dashdb-for-transactions free us-south
   ```
   {: pre}
   
   The `Lite(free)` plan is not available in all locations. Other plan is available.

1. To access the database service from Cloud Functions later on, you need the authorization. Thus, you create service credentials and label them **promotion**.

   ```sh
   ibmcloud resource service-key-create promotion Manager --instance-name promotionDB
   ```


### Step 5 - Configure Cloud Functions

IBM Cloud Functions is a distributed compute service that executes application logic in response to requests from web or mobile apps. You can set up specific actions to occur based on HTTP-based API requests from web apps or mobile apps, and from event-based requests from services like Cloudant. Functions can run your code snippets on demand or automatically in response to events.

With IBM Cloud™ Functions, you can use your favorite programming language to write lightweight code that runs app logic in a scalable way. The Function-as-a-Service (FaaS) programming platform is based on the open source project Apache OpenWhisk.

In this section, you are going to register actions for Cloud Functions and bind service credentials to those actions. The Cloud Functions will be triigered by the Watson chatbot and search for on-sales information stored in DB2 database of IBM Cloud and Watson Discovery service. 

Because the Cloud Functions is not the focus of the repo, scripts are provided to automate the Cloud Functions configuration. In addition to be used by the Watson chatbot webhook, the Cloud Functions is also configured for the environment preparation.

To perform the registration and setup, run the command below and this will execute the **setup.sh** script. If your system does not support shell commands, copy each line out of the file **setup.sh** and execute it individually.

1. Configure Cloud Function

   ```sh
   ./setup.sh YOURSECRET "dashdb-for-transactions"
   ```

   **Note:** The script also inserts couple of rows of sample data. You can disable this by outcommenting the following line in the above script: `#ibmcloud fn action invoke slackdemo/db2Setup -p mode "[\"sampledata\"]" -r`.

1.  Obtain the URI for the deployed **dispatch** action.

   ```sh
   ibmcloud fn action get chatbot-promotion-pkg/dispatch --url
   ```

   Keep this information available for the next section.








## Create an assistant and integrate with Slack
{: #slack-chatbot-database-watson-4}
{: step}

Now, you will create an assistant associated with the skill from before and integrate it with Slack.
1. Click on **Assistants** in the top left navigation, then click on **Create assistant**.
2. In the dialog, fill in **TutorialAssistant** as name, then click **Create assistant**. On the next screen, choose **Add dialog skill**. Thereafter, choose **Add existing skill**, pick **TutorialSlackbot** from the list and add it.
3. After adding the skill, click **Add integration**, then from the list of **Third-party integrations** select **Slack**.
4. Follow the step by step instructions to integrate your chatbot with Slack. More information about it is available in the topic [Integrating with Slack](https://{DomainName}/docs/assistant?topic=assistant-deploy-slack).

## Test the Slackbot and learn
{: #slack-chatbot-database-watson-5}
{: step}
Open up your Slack workspace for a test drive of the chatbot. Begin a direct chat with the bot.

1. Type **help** into the messaging form. The bot should respond with some guidance.
2. Now enter **new event** to start gathering data for a new event record. You will use {{site.data.keyword.conversationshort}} slots to collect all the necessary input.
3. First up is the event identifier or name. Quotes are required. They allow entering more complex names. Enter **"Meetup: IBM Cloud"** as the event name. The event name is defined as a pattern-based entity **eventName**. It supports different kinds of double quotes at the beginning and ending.
4. Next is the event location. Input is based on the [system entity **sys-location**](https://{DomainName}/docs/assistant?topic=assistant-system-entities#system-entity-details). As a limitation, only cities recognized by {{site.data.keyword.conversationshort}} can be used. Try **Friedrichshafen** as a city.
5. Contact information such as an email address or URI for a website is asked for in the next step. Start with **https://www.ibm.com/events**. You will use a pattern-based entity for that field.
6. The next questions are gathering date and time for the begin and end. **sys-date** and **sys-time** are used which allow for different input formats. Use **next Thursday** as start date, **6 pm** for the time, use the exact date of next Thursday, e.g., **2019-05-09** and **22:00** for the end date and time.
7. Last, with all data collected, a summary is printed and a server action, implemented as {{site.data.keyword.openwhisk_short}} action, is invoked to insert a new record into Db2. Thereafter, dialog switches to a child node to clean up the processing environment by removing the context variables. The entire input process can be canceled anytime by entering **cancel**, **exit** or similar. In that case, the user choice is acknowledged and the environment cleaned up.
  ![Sample chat in the Slack app](images/solution19/SlackSampleChat.png)

With some sample data in it is time to search.
1. Type in **show event information**. Next is a question whether to search by identifier or by date. Enter a **name** and for the next question **"Think 2019"**. Now, the chatbot should display information about that event. The dialog has multiple responses to choose from.
2. With {{site.data.keyword.conversationshort}} as a backend, it is possible to enter more complex phrases and thereby skipping parts of the dialog. Use **show event by the name "Think 2019"** as input. The chatbot directly returns the event record.
3. Now you are going to search by date. A search is defined by a pair of dates, the event start date has to be between. With **search conference by date in February 2019** as input, the result should be the **Think 2019** event again. The entity **February** is interpreted as two dates, February 1st, and February 28th, thereby providing input for the start and end of the date range. [If no year 2019 would be specified, a February looking ahead would be identified](https://{DomainName}/docs/assistant?topic=assistant-system-entities#system-entities-sys-date-time).

After some more searches and new event entries, you can revisit the chat history and improve the future dialog. Follow the instructions in the [{{site.data.keyword.conversationshort}} documentation on **Improving understanding**](https://{DomainName}/docs/assistant?topic=assistant-logs-intro#logs_intro).

## Share resources
{: #slack-chatbot-database-watson-6}
{: step}

If you want to work with others on resources of this solution tutorial, you can share all or only some of the components. [{{site.data.keyword.cloud_notm}} Identity and Access Management (IAM)](https://{DomainName}/docs/account?topic=account-iamoverview) enables the authentication of users and service IDs and the access control to cloud resources. For granting access to a resource, you can assign [predefined access roles](https://{DomainName}/docs/account?topic=account-userroles) to either a user, a service ID, or to an [access group](https://{DomainName}/docs/account?topic=account-groups). Details on how you can set up access control is discussed in the blog [IBM Cloud Security Hands-On: Share Your Chatbot Project](https://www.ibm.com/cloud/blog/share-your-chatbot-project).


## Remove resources
{: #slack-chatbot-database-watson-7}
{:removeresources}
{: step}

Executing the cleanup script in the main directory deletes the event table from {{site.data.keyword.Db2_on_Cloud_short}} and removes the actions from {{site.data.keyword.openwhisk_short}}. This might be useful when you start modifying and extending the code. The cleanup script does not change the {{site.data.keyword.conversationshort}} workspace or skill.
```sh
sh cleanup.sh
```
{: pre}

In the [{{site.data.keyword.Bluemix_short}} Resource List](https://{DomainName}/resources) open the overview of your services. Locate the instance of the {{site.data.keyword.conversationshort}} service, then delete it.

## Expand the tutorial
{: #slack-chatbot-database-watson-8}
Want to add to or change this tutorial? Here are some ideas:
1. Add search capabilities to, e.g., wildcard search or search for event durations ("give me all events longer than 8 hours").
2. Use {{site.data.keyword.databases-for-postgresql}} instead of {{site.data.keyword.Db2_on_Cloud_short}}.
3. Add a weather service and retrieve forecast data for the event date and location.
4. [Control the encryption keys for your database by adding {{site.data.keyword.keymanagementservicelong_notm}}](https://{DomainName}/docs/Db2onCloud?topic=Db2onCloud-key-protect).
5. Export event data as iCalendar **.ics** file.


## Related content
{: #slack-chatbot-database-watson-9}
{:related}

Here are links to additional information on the topics covered in this tutorial.

Chatbot-related blog posts:
* [Chatbots: Some tricks with slots in IBM Watson Conversation](https://www.ibm.com/cloud/blog/chatbots-some-tricks-with-slots-in-ibm-watson-conversation)
* [Lively chatbots: Best Practices](https://www.ibm.com/blogs/bluemix/2017/07/lively-chatbots-best-practices/)
* [Building chatbots: more tips and tricks](https://www.ibm.com/blogs/bluemix/2017/06/building-chatbots-tips-tricks/)
* [Add Watson Discovery News to your Chatbot](https://www.ibm.com/cloud/blog/add-watson-discovery-news-to-your-chatbot)
* [IBM Cloud Security Hands-On: Share Your Chatbot Project](https://www.ibm.com/cloud/blog/share-your-chatbot-project)

Documentation and SDKs:
* GitHub repository with [tips and tricks for handling variables in IBM Watson Conversation](https://github.com/IBM-Cloud/watson-conversation-variables)
* [{{site.data.keyword.openwhisk_short}} documentation](https://{DomainName}/docs/openwhisk)
* Documentation: [IBM Knowledge Center for {{site.data.keyword.Db2_on_Cloud_short}}](https://www.ibm.com/support/knowledgecenter/en/SS6NHC/com.ibm.swg.im.dashdb.kc.doc/welcome.html)
* [Free Db2 edition for developers](https://www.ibm.com/us-en/marketplace/ibm-db2-direct-and-developer-editions) for developers
* Documentation: [API Description of the ibm_db Node.js driver](https://github.com/ibmdb/node-ibm_db)
* [{{site.data.keyword.cloudantfull}} documentation](https://{DomainName}/docs/Cloudant?topic=cloudant-overview#overview)



