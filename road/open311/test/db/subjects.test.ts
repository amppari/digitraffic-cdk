import * as pgPromise from "pg-promise";
import * as SubjectsDb from "../../lib/db/subjects";
import {newSubject} from "../testdata";
import {dbTestBase} from "../db-testutil";
import {shuffle} from "../../../../common/js/js-utils";
import {Locale} from "../../lib/model/locale";

describe('db-subjects', dbTestBase((db: pgPromise.IDatabase<any,any>) => {

    test('findAll', async () => {
        const locale = shuffle([Locale.ENGLISH, Locale.FINNISH, Locale.SWEDISH])[0];
        const subjects = Array.from({length: Math.floor(Math.random() * 10)}).map(() => {
            return newSubject(locale);
        });
        await SubjectsDb.update(subjects, db);

        const foundSubjects = await SubjectsDb.findAll(locale, db);

        expect(foundSubjects.length).toBe(subjects.length);
    });

    test('update - old subjects are cleared', async () => {
        const locale = shuffle([Locale.ENGLISH, Locale.FINNISH, Locale.SWEDISH])[0];
        const previousSubject = newSubject(locale);
        await SubjectsDb.update([previousSubject], db);

        const theNewSubject = newSubject(locale);
        await SubjectsDb.update([theNewSubject], db);

        const foundSubjects = await SubjectsDb.findAll(locale, db);

        expect(foundSubjects.length).toBe(1);
        expect(foundSubjects[0]).toMatchObject(theNewSubject);
    });

}));
