// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import "./DataCard.scss";

import * as React from "react";

import * as moment from "moment";

import { Button } from "azure-devops-ui/Button";
import { ButtonGroup } from "azure-devops-ui/ButtonGroup";
import { Card } from "azure-devops-ui/Card";
import { FormItem } from "azure-devops-ui/FormItem";
import { IStatusProps, Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { TextField, TextFieldStyle } from "azure-devops-ui/TextField";
import { Tooltip } from "azure-devops-ui/TooltipEx";

import { GlobalMessageBanner, Level } from "../models/global-message-banners";
import { ExpiryPicker } from "./expiryPicker";
import { LevelDropdown } from "./levelDropdown";
import * as SDK from "azure-devops-extension-sdk";
import { ILocationService, CommonServiceIds } from "azure-devops-extension-api";

interface IBannerCardProps {
    text: string
    onSave(text: string): void;
    onDelete(): void;
}

interface IBannerCardState extends Partial<GlobalMessageBanner> {
    dirty: boolean;
    loading: boolean;
    expanded: boolean;
    expiryErrorText?: string;
    messageErrorText?: string;
}

export class BannerCard extends React.Component<IBannerCardProps, IBannerCardState> {
    constructor(props: IBannerCardProps) {
        super(props);

        const text = this.props.text;
        const project = text.split(".")[0];
        const repo = text.split(".")[1];
        const message = text.split(".")[2];
        const level = Number(text.split(".")[3]);
        this.state = {
            level: level,
            project: project,
            repo: repo,
            message: message,
            dirty: false,
            loading: false,
            expanded: false,
        };
    }

    public componentDidMount(): void {
        this.setupFields();
    }

    public componentDidUpdate(prevProps: IBannerCardProps): void {
        if (JSON.stringify(prevProps.text) !== JSON.stringify(this.props.text)) {
            this.setupFields();
        }
    }

    public render(): JSX.Element {
        const statusProps = this.getStatusProps();

        return (
            <Card className="banner-card">
                <div className="banner-item">
                    <div className="banner-header">
                        <Tooltip text={statusProps.text}>
                            <div>
                                <Status
                                    {...statusProps}
                                    text={this.errorText}
                                    size={StatusSize.l}
                                />
                            </div>
                        </Tooltip>
                        <FormItem className="header-message">
                            <label className="itemTitle">Project Name: </label>
                            <TextField
                                value={this.state.project}
                                onChange={(e, newValue) => {
                                    this.setState({
                                        project: newValue,
                                        messageErrorText: this.getMessageError(newValue),
                                    });
                                    this.ensureMarkedDirty();
                                }}
                                placeholder="project name"
                                style={TextFieldStyle.inline}
                            />
                            <label className="itemTitle">Repo Name: </label>
                            <TextField
                                value={this.state.repo}
                                onChange={(e, newValue) => {
                                    this.setState({
                                        repo: newValue,
                                        messageErrorText: this.getMessageError(newValue),
                                    });
                                    this.ensureMarkedDirty();
                                }}
                                placeholder="repo name (If it is a project-specific banner, keep it empty)"
                                style={TextFieldStyle.inline}
                            />
                            <label className="itemTitle">Message: </label>
                            <TextField
                                prefixIconProps={{ iconName: Level[this.state.level] }}
                                value={this.state.message}
                                onChange={(e, newValue) => {
                                    this.setState({
                                        message: newValue,
                                        messageErrorText: this.getMessageError(newValue),
                                    });
                                    this.ensureMarkedDirty();
                                }}
                                placeholder="Message"
                                style={TextFieldStyle.inline}
                            />
                        </FormItem>
                        <ButtonGroup className="header-buttons">
                            <Button
                                iconProps={{ iconName: "Edit" }}
                                text={this.state.expanded === true ? "Edit less" : "Edit more"}
                                onClick={() => {
                                    this.setState({ expanded: !this.state.expanded });
                                }}
                            />
                            <Button
                                iconProps={{ iconName: "Save" }}
                                primary={true}
                                disabled={!this.isSaveEnabled}
                                onClick={() => this.saveBanner()}
                                tooltipProps={{ text: "Save" }}
                            />
                            <Button
                                iconProps={{ iconName: "Delete" }}
                                danger={true}
                                onClick={() => this.deleteBanner()}
                                tooltipProps={{ text: "Delete" }}
                            />
                        </ButtonGroup>
                    </div>
                    {this.state.expanded === true ? <div className="banner-body">
                        <FormItem label="Level" className="level-dropdown">
                            <LevelDropdown
                                level={this.state.level}
                                onChange={(level) => {
                                    this.setState({ level });
                                    this.ensureMarkedDirty();
                                }}
                            />
                        </FormItem>
                        <ExpiryPicker
                            expiryDate={this.state.expirationDate}
                            onChange={(expirationDate) => {
                                this.setState({ expirationDate, expiryErrorText: null });
                                this.ensureMarkedDirty();
                            }}
                            onParseError={(errorMessage) => {
                                this.setState({ expiryErrorText: errorMessage });
                            }}
                        />
                    </div> : null}
                </div>
            </Card>
        );
    }

    private getMessageError(message: string): string {
        if (message.split(" ").length >= 30) {
            return "Message too long";
        }

        return null;
    }

    private async saveBanner(): Promise<void> {
        this.setState({ loading: true });

        const project = this.state.project;
        const repo = this.state.repo;
        const message = this.state.message;
        const level = `${this.state.level}`
        const messageid = ((new Date()).getTime() % Number.MAX_SAFE_INTEGER).toString();
        const data = message + "&&" + level;

        try {
            const locationService = await SDK.getService<ILocationService>(CommonServiceIds.LocationService);
            const rooturl = await locationService.getServiceLocation();
            const accessToken = await SDK.getAccessToken();
            const url = `${rooturl}_apis/settings/entries/host?api-version=3.2-preview`;
            console.log(url);
            const ret: {[name: string]: string} = {};
            let title:string = "";
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
            ret[title] = data;
            const response = await window.fetch(url, {
                                method: "PATCH",
                                body: JSON.stringify(ret),
                                headers: {
                                    "Authorization": `Bearer ${accessToken}`,
                                    "Content-Type": "application/json",
                                },
                            });
            console.log(ret);

            this.props.onSave(`${project}.${repo}.${data}`);

            this.setState({ dirty: false, loading: false });
        } catch (ex) {
            this.setState({ messageErrorText: "Unable to save" });
        }
    }

    private async deleteBanner(): Promise<void> {
        try {
            const locationService = await SDK.getService<ILocationService>(CommonServiceIds.LocationService);
            const rooturl = await locationService.getServiceLocation();
            const accessToken = await SDK.getAccessToken();
            const url = `${rooturl}_apis/settings/entries/host/date?api-version=3.2-preview`;
            console.log(url);
            const response = await window.fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const responseString = await response.text();
            const webEntity = JSON.parse(responseString) as ObjectListWithCount<string>
            if (Object.keys(webEntity.value).indexOf(`${this.state.project}/${this.state.repo}`) !== -1){
                await this.deleteWebdata(this.state.project, this.state.repo);
            }
            // if (this.state.project === null || this.state.repo === null || this.state.message === null ){
            //     await this.deleteWebdata(this.state.project, this.state.repo);
            // }

            this.props.onDelete();
        } catch (ex) {
            this.setState({ messageErrorText: "Unable to delete" });
        }
    }

    private async deleteWebdata(project : string, repo : string): Promise<void> {
        const locationService = await SDK.getService<ILocationService>(CommonServiceIds.LocationService);
        const rootUrl = await locationService.getServiceLocation();
        const accessToken = await SDK.getAccessToken();
        const url = `${rootUrl}_apis/settings/entries/host/date/${project}/${repo}?api-version=3.2-preview`;
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

    private get isSaveEnabled(): boolean {
        return this.state.dirty
            && this.errorText == null
            && !this.isMessageExpired;
    }

    private get isMessageExpired(): boolean {
        return this.state.expirationDate != null && (this.state.expirationDate < new Date());
    }

    private ensureMarkedDirty(): void {
        if (this.state.dirty === false) {
            this.setState({ dirty: true });
        }
    }

    private setupFields(): void {
        if (this.props.text == null) {
            return;
        }

        const text = this.props.text;
        const project = text.split(".")[0];
        const repo = text.split(".")[1];
        const message = text.split(".")[2];
        const level = Number(text.split(".")[3]);
        this.state = {
            level: level,
            project: project,
            repo: repo,
            message: message,
            dirty: false,
            loading: false,
            expanded: false,
        };
    }

    private getStatusProps(): IStatusProps {
        if (this.errorText != null) {
            return {
                ...Statuses.Failed,
                text: this.errorText,
            };
        }

        if (!this.state.dirty) {
            if (this.state.expirationDate == null) {
                return {
                    ...Statuses.Success,
                    text: "The message will be shown indefinitely.",
                };
            } else {
                const dateMoment = moment(this.state.expirationDate);
                if (dateMoment.isBefore(moment.now())) {
                    return {
                        ...Statuses.Warning,
                        // tslint:disable-next-line:max-line-length
                        text: `The message was shown until ${dateMoment.calendar().toLocaleLowerCase()}. Change the expiration date to show again.`,
                    };
                } else {
                    return {
                        ...Statuses.Success,
                        text: `The message will be shown until ${dateMoment.calendar().toLocaleLowerCase()}.`,
                    };
                }
            }
        } else {
            return {
                ...Statuses.Warning,
                text: "The shown message is out of date. Save your changes.",
            };
        }
    }

    private get errorText(): string {
        return this.state.messageErrorText == null ? this.state.expiryErrorText : this.state.messageErrorText;
    }
}


export class ObjectListWithCount<T> {
    public count: number;
    public value: {[name: string]: T};
}
