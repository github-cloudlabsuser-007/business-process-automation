import { TextAnalyticsActions, TextAnalyticsClient, AzureKeyCredential, PagedAnalyzeActionsResult, AnalyzeActionsPollerLike, AnalyzeHealthcareEntitiesPollerLike } from "@azure/ai-text-analytics";
import { BpaServiceObject } from "../engine/types";

export class LanguageStudio {

    private _endpoint: string
    private _apikey: string
    private _language: string

    constructor(endpoint: string, apikey: string) {
        this._endpoint = endpoint
        this._apikey = apikey
        this._language = "en"
    }

    private _healthCare = async (client : TextAnalyticsClient, documents) : Promise<AnalyzeHealthcareEntitiesPollerLike> => {
        return await client.beginAnalyzeHealthcareEntities(documents, this._language, {
            includeStatistics: true
        });
    }

    private _analyze = async (client : TextAnalyticsClient, documents, actions) : Promise<AnalyzeActionsPollerLike> => {
        return await client.beginAnalyzeActions([documents], actions, this._language);
    }

    private _recognize = async (input: BpaServiceObject, actions: TextAnalyticsActions, type: string, label: string, resultType: string, analyzeType : boolean): Promise<BpaServiceObject> => {
        const client = new TextAnalyticsClient(this._endpoint, new AzureKeyCredential(this._apikey));
        let poller
        if(analyzeType){
            poller = await this._analyze(client, [input.data], actions);
        } else {
            poller = await this._healthCare(client, [input.data])
        }

        poller.onProgress(() => {
            console.log(
                `Number of actions still in progress: ${poller.getOperationState().actionsInProgressCount}`
            );
        });

        console.log(`The analyze actions operation created on ${poller.getOperationState().createdOn}`);

        console.log(
            `The analyze actions operation results will expire on ${poller.getOperationState().expiresOn}`
        );

        const resultPages: PagedAnalyzeActionsResult = await poller.pollUntilDone();

        let out = []
        for await (const page of resultPages) {
            //for (const result of page[resultType]) {
                out.push(page)
            //}
        }
        const result: BpaServiceObject = {
            data: out,
            type: type,
            label: label,
            bpaId: input.bpaId,
            projectName: input.projectName
        }
        return result
    }

    public recognizeEntities = async (input: BpaServiceObject): Promise<BpaServiceObject> => {
        const actions: TextAnalyticsActions = {
            recognizeEntitiesActions: [{ modelVersion: "latest" }]
        };

        return await this._recognize(input, actions, 'recognizeEntities', 'recognizeEntities', "recognizeEntitiesResults", true)
    }

    public recognizePiiEntities = async (input: BpaServiceObject): Promise<BpaServiceObject> => {
        const actions: TextAnalyticsActions = {
            recognizePiiEntitiesActions: [{ modelVersion: "latest" }]
        };

        return await this._recognize(input, actions, 'recognizePiiEntities', 'recognizePiiEntities', "recognizePiiEntitiesResults", true)
    }

    public extractKeyPhrases = async (input: BpaServiceObject): Promise<BpaServiceObject> => {
        const actions: TextAnalyticsActions = {
            extractKeyPhrasesActions: [{ modelVersion: "latest" }]
        };

        return await this._recognize(input, actions, 'extractKeyPhrases', 'extractKeyPhrases', "extractKeyPhrasesResults", true)
    }

    public recognizeLinkedEntities = async (input: BpaServiceObject): Promise<BpaServiceObject> => {
        const actions: TextAnalyticsActions = {
            recognizeLinkedEntitiesActions: [{ modelVersion: "latest" }]
        };

        return await this._recognize(input, actions, 'recognizeLinkedEntities', 'recognizeLinkedEntities', "recognizeLinkedEntitiesResults", true)
    }

    public analyzeSentiment = async (input: BpaServiceObject): Promise<BpaServiceObject> => {
        const actions: TextAnalyticsActions = {
            analyzeSentimentActions: [{ modelVersion: "latest" }]
        };

        return await this._recognize(input, actions, 'analyzeSentiment', 'analyzeSentiment', "analyzeSentimentResults", true)
    }

    public extractSummary = async (input: BpaServiceObject): Promise<BpaServiceObject> => {
        const actions: TextAnalyticsActions = {
            extractSummaryActions: [{ modelVersion: "latest" }]
        };

        let out = ""
        const summaryResults =  await this._recognize(input, actions, 'extractSummary', 'extractSummary', "extractSummaryResults", true)
        for(const page of summaryResults.data){
            for(const result of page.extractSummaryResults[0].results){
                for(const sentence of result.sentences){
                    out += " " + sentence.text
                }
            }
        }

        return {
            data : out,
            type : "text",
            projectName : input.projectName,
            bpaId : input.bpaId,
            label : "extractSummary"
        }
    }

    public recognizeCustomEntities = async (input: BpaServiceObject): Promise<BpaServiceObject> => {
        const actions: TextAnalyticsActions = {
            recognizeCustomEntitiesActions: [{ projectName: input.serviceSpecificConfig.projectName, deploymentName: input.serviceSpecificConfig.deploymentName }]
        };

        return await this._recognize(input, actions, 'recognizeCustomEntities', 'recognizeCustomEntities', "recognizeCustomEntitiesResults", true)
    }

    public singleCategoryClassify = async (input: BpaServiceObject): Promise<BpaServiceObject> => {
        const actions: TextAnalyticsActions = {
            singleCategoryClassifyActions: [{ projectName: input.serviceSpecificConfig.projectName, deploymentName: input.serviceSpecificConfig.deploymentName }]
        };

        return await this._recognize(input, actions, 'singleCategoryClassify', 'singleCategoryClassify', "singleCategoryClassifyResults", true)
    }

    public multiCategoryClassify = async (input: BpaServiceObject): Promise<BpaServiceObject> => {
        const actions: TextAnalyticsActions = {
            multiCategoryClassifyActions: [{ projectName: input.serviceSpecificConfig.projectName, deploymentName: input.serviceSpecificConfig.deploymentName }]
        };

        return await this._recognize(input, actions, 'multiCategoryClassify', 'multiCategoryClassify', "multiCategoryClassifyResults", true)
    }

    public healthCare = async (input: BpaServiceObject): Promise<BpaServiceObject> => {
        const actions: TextAnalyticsActions = {
            multiCategoryClassifyActions: [{ projectName: input.serviceSpecificConfig.projectName, deploymentName: input.serviceSpecificConfig.deploymentName }]
        };

        return await this._recognize(input, actions, 'healthCare', 'healthCare', "healthCareResults", false)
    }

}