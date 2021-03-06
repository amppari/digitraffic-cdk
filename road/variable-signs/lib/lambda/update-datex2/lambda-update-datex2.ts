import {updateDatex2} from "../../service/variable-sign-updater";

export const handler = async (event: any): Promise<any> => {
    const datex2 = event.body;

    if(datex2) {
        console.info(datex2);

        try {
            return await updateDatex2(datex2);
        } catch(e) {
            return {statusCode:500};
        }
    }

    return {statusCode:400};
};
