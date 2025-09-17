import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CaptureRequestMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction) {
		const timestamp = new Date().toISOString();
		console.log(`[${ timestamp }] ${ req.method } ${ req.originalUrl }`);
		console.log('Headers:', req.headers);
		console.log('Body:', req.body);
		console.log('Query:', req.query);

		next();
	}
}
