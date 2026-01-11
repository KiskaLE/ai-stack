
import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import type { ZodType } from 'zod';

export class ZodValidationPipe implements PipeTransform {
    constructor(private schema: ZodType) { }

    transform(value: unknown, metadata: ArgumentMetadata) {
        try {
            if (metadata.type !== 'body') {
                return value;
            }
            const parsedValue = this.schema.parse(value);
            return parsedValue;
        } catch (error) {
            throw new BadRequestException('Validation failed');
        }
    }
}
