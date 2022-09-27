import "es6-promise/auto";
import { CommonServiceIds,  IGlobalMessagesService, IGlobalMessageBanner, ILocationService } from "azure-devops-extension-api";
import { IProjectPageService, IHostNavigationService } from "azure-devops-extension-api"
// import fetch from 'node-fetch';
import * as SDK from "azure-devops-extension-sdk";


function sleep(timeout) {
    return new Promise(resolve => setTimeout(resolve, timeout))
}

  
SDK.notifyLoadSucceeded().then( 
    async () => {
        const projectservice = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService)
        const projectinfo = await projectservice.getProject()
        let projectname : string = projectinfo.name;
        const GlobalMessagesService = await SDK.getService<IGlobalMessagesService>(CommonServiceIds.GlobalMessagesService);
        const accessToken = await SDK.getAccessToken();
        const locationService = await SDK.getService<ILocationService>(CommonServiceIds.LocationService);
        const rooturl = await locationService.getServiceLocation();

        const hostservice = await SDK.getService<IHostNavigationService>(CommonServiceIds.HostNavigationService)
        const pageinfo = await hostservice.getPageRoute();
        console.log(pageinfo)
        let pagevalue = pageinfo.routeValues;
        let reponame = Object.keys(pagevalue).indexOf("GitRepositoryName") !== -1 ? pagevalue["GitRepositoryName"]: "";
        console.log(reponame)

        let url:string = `${rooturl}_apis/settings/entries/host?api-version=3.2-preview`

        const response_flag = await window.fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const responsetext = await response_flag.text();
        const webEntityflag = JSON.parse(responsetext) as ObjectListWithCount<string>
        const flag = Object.keys(webEntityflag).indexOf("flag") !== -1 ?webEntityflag.value["flag"]: "False";
        if (flag === "False"){
            return;
        }

        if (reponame === ""){
            reponame = projectname;
        }
        
        url = `${rooturl}_apis/settings/entries/host/date/${projectname}?api-version=3.2-preview`;
        const response = await window.fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const responseString = await response.text();
        const webEntity = JSON.parse(responseString) as ObjectListWithCount<string>
        console.log(webEntity.value)

        let datainfo: string = ""
        Object.keys(webEntity.value).forEach((title) => {
            console.log(title);
            if (title.indexOf("/") !== -1){
            }
            else{
                datainfo = webEntity.value[title];
                let banner : IGlobalMessageBanner = {
                    message: datainfo.split("&&")[0],
                    level: Number(datainfo.split("&&")[1]),
                } 
                GlobalMessagesService.addBanner(banner);
            }
        });

        url = `${rooturl}_apis/settings/entries/host/date/${projectname}/${reponame}?api-version=3.2-preview`;
        const response2 = await window.fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const responseString2 = await response2.text();
        const webEntity2 = JSON.parse(responseString2) as ObjectListWithCount<string>
        console.log(webEntity2.value)

        Object.keys(webEntity2.value).forEach((title) => {
                datainfo = webEntity2.value[title];
                let banner : IGlobalMessageBanner = {
                    message: datainfo.split("&&")[0],
                    level: Number(datainfo.split("&&")[1]),
                } 
                GlobalMessagesService.addBanner(banner);
            })
        })

SDK.init();


export class ObjectListWithCount<T> {
    public count: number;
    public value: {[name: string]: T};
}
