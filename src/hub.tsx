// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import "./hub.scss";

import * as React from "react";

import { CommonServiceIds, IHostPageLayoutService, IGlobalMessagesService, IGlobalMessageBanner, ILocationService } from "azure-devops-extension-api";
import { IProjectPageService } from "azure-devops-extension-api"
import * as SDK from "azure-devops-extension-sdk";

import { Header, TitleSize } from "azure-devops-ui/Header";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import { Page } from "azure-devops-ui/Page";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { ZeroData, ZeroDataActionType } from "azure-devops-ui/ZeroData";

import { showRootComponent } from "./common/common";
import { BannerCard } from "./components/DataCard";

function sleep(timeout) {
    return new Promise(resolve => setTimeout(resolve, timeout))
}

interface IHubComponentState {
    text: string[];
    toggle: boolean;
    loading: boolean;
    errorText: string;
}

class HubComponent extends React.Component<{}, IHubComponentState> {
    public readonly levelList: IListBoxItem[];

    constructor(props: {}) {
        super(props);

        this.state = {
            text: [],
            toggle: true,
            loading: false,
            errorText: null,
        };

    }

    public async componentDidMount(): Promise<void> {
        this.setState({ loading: true });

        try {
            const locationService = await SDK.getService<ILocationService>(CommonServiceIds.LocationService);
            const rooturl = await locationService.getServiceLocation();
            const accessToken = await SDK.getAccessToken();
            const url = `${rooturl}_apis/settings/entries/host?api-version=3.2-preview`;
            const response = await window.fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const responseString = await response.text();
            const webEntity = JSON.parse(responseString) as ObjectListWithCount<string>
            Object.keys(webEntity.value).forEach((title) => {
                if (title === "flag"){
                    this.setState({toggle: webEntity.value[title] === "True"})
                }
                else{
                    if (title.split("/").length === 4){
                        this.state.text.push(title.split("/")[1] + "." + title.split("/")[2] + "." + webEntity.value[title].split("&&")[0] + "." + webEntity.value[title].split("&&")[1])
                    }
                    else{
                        this.state.text.push(title.split("/")[1] + "." + "all repo" + "." + webEntity.value[title].split("&&")[0] + "." + webEntity.value[title].split("&&")[1])
                    }
                }
            });
            this.setState({ loading: false });
        } catch (ex) {
            this.setState({ loading: false, errorText: `There was an error loading the text: ${ex.message}` });
        }
    }

    public render(): JSX.Element {
        return (
            <Page className="container flex-grow">
                <Header
                    title="Manage your data"
                    commandBarItems={this.getCommandBarItems()}
                    titleSize={TitleSize.Large}
                >
                <div className="upload">
                <input type="file" name="upload" id="upload" accept=".csv"/>
                </div>
                {/* <div className="indicate_text" >Whether to show specific banner:</div>
                <input type="checkbox" id="on" onClick={this.set_open} />
                <label  className="switch" htmlFor="on">
                        <span className="ball"></span>
                </label> */}
                </Header>
                {
                    this.state.errorText == null ? null :
                        <MessageCard
                            className="error-message-card"
                            onDismiss={() => this.setState({ errorText: null })}
                            severity={MessageCardSeverity.Error}
                        >
                            {this.state.errorText}
                        </MessageCard>
                }
                {this.state.text != null && this.state.text.length !== 0
                    ?(
                        <div className="items-container">
                            <div className="date-infos">
                                {this.state.text.map((data, index) => (
                                    <BannerCard
                                        key={index}
                                        text={data}
                                        onSave={(newdata) => {
                                            const { text } = this.state;
                                            console.log(text)
                                            text[index] = newdata;
                                            this.setState({ text });
                                        }}
                                        onDelete={() => {
                                            const { text } = this.state;
                                            text.splice(index, 1);
                                            this.setState({ text });
                                        }}
                                    />
                                ))}
                            </div>
                            <div className="instruction-text">
                                None temporary
                            </div>
                        </div>
                    )
                    :(
                        <div className="no-data-view">
                            {this.state.loading === true
                                ? (
                                    <Spinner size={SpinnerSize.large} />
                                ) : (
                                    <ZeroData
                                        primaryText="No data yet..."
                                        imageAltText="Icon"
                                        imagePath="../static/icon.png"
                                    />
                                )
                            }
                        </div>
                    )
                }    
            </Page>
        );
    }

    private getCommandBarItems(): IHeaderCommandBarItem[] {
        return [
            {
                id: "toggle",
                ariaLabel: this.state.toggle ? "Close the specific banner" : "Show the specific banner",
                iconProps: {
                    iconName: this.state.toggle ? "Turn off" : "Turn on"
                },
                onActivate: () => { this.set_toggle() }
            },
            {
                id: "Upload",
                text: "Upload file",
                isPrimary: true,
                iconProps: {
                    iconName: "Add",
                },

                onActivate: () => { this.uploadfile(); },
            },
            {
                id: "add",
                text: "Add new data",
                isPrimary: true,
                iconProps: {
                    iconName: "Add",
                },
                onActivate: () => { this.onAddClicked(); },
            },
            {
                id: "delete-all",
                text: "Delete all data",
                iconProps: {
                    iconName: "Delete",
                },
                onActivate: () => { this.onDeleteAllClicked(); },
            },
            // {
            //     id: "info",
            //     subtle: true,
            //     iconProps: {
            //         iconName: "Info",
            //     },
            //     onActivate: () => { this.onAboutClicked(); },
            //     tooltipProps: {
            //         text: "About Banner Settings",
            //     },
            // },
        ];
    }

    private async set_toggle(): Promise<void>{
        const locationService = await SDK.getService<ILocationService>(CommonServiceIds.LocationService);
        this.setState({toggle: !this.state.toggle})
        const rooturl = await locationService.getServiceLocation();
        const accessToken = await SDK.getAccessToken();
        const url = `${rooturl}_apis/settings/entries/host?api-version=3.2-preview`;
        const ret: {[name: string]: string} = {};
        const title = "flag";
        ret[title] = this.state.toggle.toString();
        const response = await window.fetch(url, {
            method: "PATCH",
            body: JSON.stringify(ret),
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });
    }
    
    private async uploadfile(): Promise<void> {
        var getFileContent = function (fileInput, callback) {
            if (fileInput.files && fileInput.files.length > 0 && fileInput.files[0].size > 0) {
                var file = fileInput.files[0];
                if (window.FileReader) {
                    var reader = new FileReader();
                    reader.onloadend = function (evt) {
                        if (evt.target.readyState == FileReader.DONE) {
                            callback(evt,evt.target.result);
                        }
                    };
                    reader.readAsText(file);
                }
            }
        };
        getFileContent(document.getElementById('upload'), async function (evt,str) {
            console.log(
                evt
            );
            console.log(str);
            const date_list = str.split("\n")
            const locationService = await SDK.getService<ILocationService>(CommonServiceIds.LocationService);
            const rooturl = await locationService.getServiceLocation();
            const accessToken = await SDK.getAccessToken();
            const url = `${rooturl}_apis/settings/entries/host?api-version=3.2-preview`;
            const ret: {[name: string]: string} = {};
            const messageid = ((new Date()).getTime() % Number.MAX_SAFE_INTEGER).toString();
            for(const date of date_list){
                const repo_date = date.replace("\r", "").split(", ")
                console.log(repo_date)
                if (repo_date[1] === "repo_name"){
                    continue;
                }
                const project = repo_date[0];
                const repo = repo_date[1];
                let title:string = ""
                if (project === ""){
                    title = `date/${messageid}`;
                }
                else{
                    if (repo === ""){
                        title = `date/${project}/${messageid}`;
                    }
                    else{
                        title = `date/${project}/${repo}/${messageid}`;
                    }
                }
                ret[title] = repo_date[2] + "&&" + repo_date[3];
            }
            const response = await window.fetch(url, {
                                method: "PATCH",
                                body: JSON.stringify(ret),
                                headers: {
                                    "Authorization": `Bearer ${accessToken}`,
                                    "Content-Type": "application/json",
                                },
                            });
            console.log(ret);
        });
        sleep(5000);
        await this.componentDidMount();
    }
    
    private async onAddClicked(): Promise<void>{
        const { text } = this.state;
        text.push("...");
        this.setState({text});
    }

    private async onDeleteAllClicked(): Promise<void> {
        const dialogService = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
        dialogService.openMessageDialog(
            "Are you sure you want to delete all data?",
            {
                okText: "Yes",
                onClose: (result) => result === true ? this.deleteAllBanners() : null,
                showCancel: true,
                title: "Delete all data",
            },
        );
    }

    private async deleteAllBanners(): Promise<void> {
        try {
            await this.deleteWebdata();
            this.setState({ text: [] });
        } catch (ex) {
            this.setState({ errorText: `There was an error deleting data: ${ex.message}` });
        }
    }

    private async deleteWebdata(): Promise<void> {
        const locationService = await SDK.getService<ILocationService>(CommonServiceIds.LocationService);
        const rootUrl = await locationService.getServiceLocation();
        const accessToken = await SDK.getAccessToken();
        const url = `${rootUrl}_apis/settings/entries/host/date?api-version=3.2-preview`;
        const response = await window.fetch(url, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.status < 200 || response.status >= 400) {
            throw new Error(response.statusText);
        }
    }

    private async onAboutClicked(): Promise<void> {
        const dialogService = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
        dialogService.openMessageDialog(
            `This is an open source project on Github.
            To contribute or review the code, please visit.
            Copyright Microsoft ${new Date().getFullYear()}`,
            {
                okText: "Close",
                showCancel: false,
                title: "Upload your file",
            },
        );
    }

}

export class ObjectListWithCount<T> {
    public count: number;
    public value: {[name: string]: T};
}

showRootComponent(<HubComponent />);
