import {findAll} from "../../service/requests";
import {IConnected} from "pg-promise";

export const handler = async (
    event: {extensions: string},
    context: any,
    callback: any,
    dbParam?: IConnected<any, any>
): Promise<any> => {
    return await findAll(/true/.test(event.extensions), dbParam);
};
