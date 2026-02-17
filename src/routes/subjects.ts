import express from "express";
import {and, desc, eq, getTableColumns, ilike, or, sql} from "drizzle-orm";
import {departments, subjects} from "../db/schema";
import {db} from "../db"

const router = express.Router();

function escapeLike(str: string): string {
    return str.replace(/[\\%_]/g, "\\$&");
}

router.get('/', async (req, res) => {
    //get all the subjects with optional search, filtering and pagination.
    try {
        const {search, department, page = 1, limit = 10} = req.query;

        const currentPage = Math.max(1, Number(page) || 1);
        const limitPerPage = Math.min(100, Math.max(1, Number(limit) || 10));

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = []

        if (search) {
            const escapedSearch = escapeLike(String(search));
            filterConditions.push(
                or(
                    ilike(subjects.name, `%${escapedSearch}%`),
                    ilike(subjects.code, `%${escapedSearch}%`),
                )
            );
        }
        if (department) {
            const escapedDepartment = escapeLike(String(department));
            filterConditions.push(
                or(
                    ilike(departments.name, `%${escapedDepartment}%`),
                )
            )
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;
        const countResult = await db.select({count: sql<number>`cast(count(*) as integer)`})
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;
        const subjectsList = await db.select({
            ...getTableColumns(subjects),
            department: {...getTableColumns(departments)}
        })
            .from(subjects).leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause)
            .orderBy(desc(subjects.createdAt))
            .limit(limitPerPage).offset(offset);

        res.status(200).json({
            data: subjectsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        });

    } catch (err) {
        console.error(`Get /subjects error: ${err}`);
        res.status(500).json({error: 'Failed to get subjects'});
    }
})

export default router;