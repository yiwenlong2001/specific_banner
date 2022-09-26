### Introduction
This repo is bulit base on https://github.com/microsoft/banner-settings-ado-extension  


![](static/screenshot.png)
![](static/screenshot2.png)
![](static/screenshot3.png)

### Features

The whole design of the UI is not much different than that of the original one. I made three changes here:
- Add a button to let the user upload the configuration file.
- Add a toggle to let the user enable/disable the extension.
- Add a new field representing the displaying level for each banner configuration. The supported levels are: Info, Warning and Error.



### Restrictions

- Currently the layout of the new button and toggle are naive. I will try to use the same component library as the ADO to redraw them to make the style consisted of once we reach the final agreement of the functionality and the UI design.


### Building the project

Just run:

    npm run build:dev
    npm run package:dev

This produces a .vsix file which can be uploaded to the [Visual Studio Marketplace](https://marketplace.visualstudio.com/azuredevops)

Publish it to your own publisher by running:

    npm run publish:dev

You can then serve the extension locally and visit your newly published dev environment extension using

    npm run dev

### Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.