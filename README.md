# ScrumBot
Tracking my Cat's Feeding Schedule with IoT and Cloud Functions

## Introduction
Last summer my housemate brought home a kitten, named Scrum God, who has been looking a bit pudgy lately. This project uses an Arduino-compatible ESP8266 to track Scrum’s feeding schedule and communicate it both physically (lights) and virtually, posting to [Twitter](https://twitter.com/ScrumFeedBot), Discord and a [website](https://scrum-bot-4bd03.firebaseapp.com/).

Learn more about the project by reading the article I wrote on [LinkedIn](https://www.linkedin.com/pulse/scrumbot-tracking-my-cats-feeding-schedule-angelo-lu/)
## How it works
![Screenshot of site](/device.jpg)
The ESP8266 sends a POST request to AWS Lambda which then sends the tweet and Discord message and also saves the event in a Google Cloud Firestore database. AWS code (Python using Serverless) is not currently available as I need to strip the API keys from the source code. 

![Screenshot of site](/screenshot.jpg)
The website is hosted on Firebase Hosting and runs Javascript code to retrieve feed stats in real time. It is somewhat Progressive Web App compliant (WIP) and can be installed on mobile devices.