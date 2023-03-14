// pages/api/post/index.ts

import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';

// POST /api/post
// Required fields in body: isAwake 
// Optional fields in body: offset 
export default async function handle(req, res) {
	const { title, content } = req.body;

	const session = await getSession({ req });
	const potentialSam = await prisma.user.findFirst({
		where: {
			email: session.user.email
		}
	});

	const isSam = potentialSam.isSam;

	if (!session || isSam !== true) {
		res.status(403).send({ Error: "You aren't even Sam" });
		return;
	}

	const result = await prisma.logEntry.create({
		data: {
			isAwake: req.body.isAwake,
			offset: req.body.offset ? req.body.offset : 0
		}
	});
	res.json(result);
}