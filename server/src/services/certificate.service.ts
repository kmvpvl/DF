// server/src/services/certificate.service.ts
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { GraphQLContext } from '../types';
import { authorize } from '../utils/auth';
import path from 'node:path';
import {
    formatDate,
    formatDateTime,
    formatDecimalLike,
    sanitizeFileNameSegment,
} from '../utils/common';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import fs from 'node:fs';

const CERTIFICATE_DOCX_MIME =
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const CERTIFICATE_DOTX_MIME =
    'application/vnd.openxmlformats-officedocument.wordprocessingml.template';

export class CertificateService {
    static async getAll(ctx: GraphQLContext) {
        authorize(ctx, Role.EMPLOYEE);
        return await prisma.certificate.findMany({
            include: {
                batch: {
                    include: {
                        product: true,
                        storageCondition: true,
                        samples: true,
                        processMap: {
                            include: {
                                parameters: true,
                                ingredients: {
                                    include: { product: true, material: true },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: [{ createdAt: 'desc' }, { number: 'desc' }],
        });
    }

    static async getBatchOptions(ctx: GraphQLContext) {
        authorize(ctx, Role.EMPLOYEE);
        return await prisma.batch.findMany({
            where: { certificate: null, locationId: ctx.locationId },
            include: {
                product: true,
                storageCondition: true,
                samples: true,
                processMap: {
                    include: {
                        parameters: true,
                        ingredients: {
                            include: { product: true, material: true },
                        },
                    },
                },
            },
            orderBy: [{ createdAt: 'desc' }, { number: 'desc' }],
        });
    }

    static async generateDocument(id: string, ctx: GraphQLContext) {
        authorize(ctx, Role.EMPLOYEE);
        const { fileName, mimeType, fileBuffer } = await this.buildPayload(id);
        return {
            fileName,
            mimeType,
            base64: fileBuffer.toString('base64'),
        };
    }

    static async create(
        input: { batchId: string; extraCertificateData?: string },
        ctx: GraphQLContext
    ) {
        authorize(ctx, Role.MANAGER);
        const batch = await prisma.batch.findUnique({
            where: { id: input.batchId },
            include: { certificate: true },
        });

        if (!batch) throw new Error('Batch not found');
        if (batch.certificate)
            throw new Error('Certificate already exists for selected batch');

        const now = new Date();
        const numberYear = now.getFullYear();

        return await prisma.$transaction(async (tx) => {
            const nextNumberAggregate = await tx.certificate.aggregate({
                where: { numberYear },
                _max: { number: true },
            });

            const nextNumber = (nextNumberAggregate._max.number ?? 0) + 1;
            const numberStr = `${String(now.getFullYear()).slice(-2)}-${String(nextNumber).padStart(9, '0')}`;

            return await tx.certificate.create({
                data: {
                    numberYear,
                    number: nextNumber,
                    numberStr,
                    batchId: input.batchId,
                    extraCertificateData:
                        input.extraCertificateData?.trim() || '',
                },
                include: {
                    batch: {
                        include: {
                            product: true,
                            storageCondition: true,
                            samples: true,
                            processMap: {
                                include: {
                                    parameters: true,
                                    ingredients: {
                                        include: {
                                            product: true,
                                            material: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
        });
    }

    static async update(
        id: string,
        input: { extraCertificateData?: string },
        ctx: GraphQLContext
    ) {
        authorize(ctx, Role.MANAGER);

        const data: Record<string, unknown> = {};
        if (input.extraCertificateData !== undefined) {
            data.extraCertificateData = input.extraCertificateData.trim();
        }

        if (Object.keys(data).length === 0)
            throw new Error('No fields provided for update');

        return await prisma.certificate.update({
            where: { id },
            data,
            include: {
                batch: {
                    include: {
                        product: true,
                        storageCondition: true,
                        samples: true,
                        processMap: {
                            include: {
                                parameters: true,
                                ingredients: {
                                    include: { product: true, material: true },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    private static async buildPayload(certificateId: string) {
        const certificate = await prisma.certificate.findUnique({
            where: { id: certificateId },
            include: {
                batch: {
                    include: {
                        product: true,
                        storageCondition: true,
                        samples: true,
                        processMap: {
                            include: {
                                parameters: true,
                                ingredients: {
                                    include: { product: true, material: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!certificate) throw new Error('Certificate not found');

        const expiresTo = new Date(certificate.batch.createdAt);
        expiresTo.setDate(
            expiresTo.getDate() + certificate.batch.storageDurationDays
        );

        const samplesList = certificate.batch.samples
            .map((sample) => {
                const suffixParts = [
                    sample.result ? `result: ${sample.result}` : null,
                    sample.studyAt
                        ? `study: ${formatDate(sample.studyAt)}`
                        : null,
                ].filter(Boolean);
                return suffixParts.length > 0
                    ? `${sample.numberStr} (${suffixParts.join(', ')})`
                    : sample.numberStr;
            })
            .join('\n');

        const ingredients = [
            ...(certificate.batch.processMap?.ingredients ?? []),
        ]
            .filter(
                (i) => i.material?.isPublicComposition === true || i.product?.id
            )
            .sort((l, r) => Number(r.amount) - Number(l.amount))
            .map((ing, idx) => ({
                index: idx + 1,
                name: ing.material?.name ?? ing.product?.name ?? 'Unknown',
                amount: ing.amount,
                unit: ing.material?.consumptionUnit ?? 'gram',
            }));

        const processMapParameters = (
            certificate.batch.processMap?.parameters ?? []
        ).map((p, idx) => ({
            index: idx + 1,
            name: p.name,
            value: p.value,
            unit: p.unit,
        }));
        const context = {
            CertificateNumberStr: certificate.numberStr,
            CertificateDate: formatDate(certificate.createdAt),
            ProductName: certificate.batch.product.name,
            BatchCreatedAt: formatDateTime(certificate.batch.createdAt),
            Outcome: `${certificate.batch.nettoWeight}`,
            SapmlesList: samplesList,
            SamplesList: samplesList,
            StorageCondition: certificate.batch.storageCondition.name,
            ExpiresTo: formatDateTime(expiresTo),
            ProcessMap: certificate.batch.processMap?.name ?? '',
            BatchNumber: certificate.batch.numberStr,
            caloriesKcal: formatDecimalLike(
                certificate.batch.product.caloriesKcal
            ),
            fatGrams: formatDecimalLike(certificate.batch.product.fatGrams),
            proteinGrams: formatDecimalLike(
                certificate.batch.product.proteinGrams
            ),
            carbohydratesGrams: formatDecimalLike(
                certificate.batch.product.carbohydratesGrams
            ),
            sugarsGrams: formatDecimalLike(
                certificate.batch.product.sugarsGrams
            ),
            fiberGrams: formatDecimalLike(certificate.batch.product.fiberGrams),
            saltGrams: formatDecimalLike(certificate.batch.product.saltGrams),
            ingredients,
            HasProcessMapParameters: processMapParameters.length > 0,
            ProcessMapParameters: processMapParameters,
            extraCertificateData: certificate.extraCertificateData,
        };

        const outputMeta = CertificateService.getCertificateOutputMeta();
        const fileBuffer = this.renderDocument(context);
        const batchNumberForFile = sanitizeFileNameSegment(
            certificate.batch.numberStr
        );

        return {
            fileName: `cert-${batchNumberForFile}.${outputMeta.extension}`,
            mimeType: outputMeta.mimeType,
            fileBuffer,
        };
    }
    private static renderDocument(
        templateData: Record<string, unknown>
    ): Buffer {
        const templatePath = CertificateService.getCertificateTemplatePath();
        const fileBuffer = fs.readFileSync(templatePath);
        const zip = new PizZip(fileBuffer);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });
        doc.render(templateData);

        const renderedZip = doc.getZip();
        const scalarValues = Object.fromEntries(
            Object.entries(templateData).filter(
                ([, v]) => typeof v !== 'object'
            )
        );

        for (const fileName of Object.keys(renderedZip.files)) {
            if (fileName.startsWith('word/') && fileName.endsWith('.xml')) {
                const xmlContent = renderedZip.file(fileName)!.asText();
                const updated = this.fillTaggedContentControls(
                    xmlContent,
                    scalarValues
                );
                if (updated !== xmlContent) renderedZip.file(fileName, updated);
            }
        }

        return Buffer.from(
            renderedZip.generate({ type: 'uint8array', compression: 'DEFLATE' })
        );
    }

    private static fillTaggedContentControls(
        xmlContent: string,
        values: Record<string, unknown>
    ): string {
        const parser = new DOMParser();
        const serializer = new XMLSerializer();
        const doc = parser.parseFromString(xmlContent, 'application/xml');
        const controls = Array.from(doc.getElementsByTagName('w:sdt'));

        for (const control of controls) {
            const pr = control.getElementsByTagName('w:sdtPr')[0];
            const tagNode = pr?.getElementsByTagName('w:tag')[0];
            const aliasNode = pr?.getElementsByTagName('w:alias')[0];
            const tag =
                tagNode?.getAttribute('w:val') ??
                aliasNode?.getAttribute('w:val');

            if (tag && tag in values) {
                const val =
                    values[tag] === null || values[tag] === undefined
                        ? ''
                        : String(values[tag]);
                const content = control.getElementsByTagName('w:sdtContent')[0];
                const texts = Array.from(
                    content?.getElementsByTagName('w:t') || []
                );
                if (texts.length > 0) {
                    texts[0].textContent = val;
                    for (let i = 1; i < texts.length; i++)
                        texts[i].textContent = '';
                }
            }
        }
        return serializer.serializeToString(doc);
    }
    static getCertificateTemplatePath(): string {
        const configuredPath = process.env.CERTIFICATE_TEMPLATE_PATH?.trim();
        if (configuredPath) {
            return path.isAbsolute(configuredPath)
                ? configuredPath
                : path.resolve(process.cwd(), configuredPath);
        }

        return path.resolve(process.cwd(), 'templates', 'certificate.dotx');
    }
    static getCertificateOutputMeta(): {
        extension: 'docx' | 'dotx';
        mimeType: string;
    } {
        const templatePath = CertificateService.getCertificateTemplatePath();
        const ext = path.extname(templatePath).toLowerCase();

        if (ext === '.dotx') {
            return {
                extension: 'dotx',
                mimeType: CERTIFICATE_DOTX_MIME,
            };
        }

        return {
            extension: 'docx',
            mimeType: CERTIFICATE_DOCX_MIME,
        };
    }

    static async buildCertificateDocumentPayload(
        certificateId: string
    ): Promise<{
        fileName: string;
        mimeType: string;
        fileBuffer: Buffer;
    }> {
        const certificate = await prisma.certificate.findUnique({
            where: { id: certificateId },
            include: {
                batch: {
                    include: {
                        product: true,
                        storageCondition: true,
                        samples: true,
                        processMap: {
                            include: {
                                parameters: true,
                                ingredients: {
                                    include: {
                                        product: true,
                                        material: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!certificate) {
            throw new Error('Certificate not found');
        }

        const expiresTo = new Date(certificate.batch.createdAt);
        expiresTo.setDate(
            expiresTo.getDate() + certificate.batch.storageDurationDays
        );

        const samplesList = certificate.batch.samples
            .map((sample) => {
                const suffixParts = [
                    sample.result ? `result: ${sample.result}` : null,
                    sample.studyAt
                        ? `study: ${formatDate(sample.studyAt)}`
                        : null,
                ].filter(Boolean);

                return suffixParts.length > 0
                    ? `${sample.numberStr} (${suffixParts.join(', ')})`
                    : sample.numberStr;
            })
            .join('\n');

        const ingredients = [
            ...(certificate.batch.processMap?.ingredients ?? []),
        ]
            .filter(
                (ingredient) =>
                    ingredient.material?.isPublicComposition === true ||
                    ingredient.product?.id
            )
            .sort((left, right) => Number(right.amount) - Number(left.amount))
            .map((ingredient, index) => ({
                index: index + 1,
                name:
                    ingredient.material?.name ??
                    ingredient.product?.name ??
                    'Unknown ingredient',
                amount: ingredient.amount,
                unit: ingredient.material?.consumptionUnit ?? 'gram',
            }));

        const processMapParameters = (
            certificate.batch.processMap?.parameters ?? []
        ).map((parameter, index) => ({
            index: index + 1,
            name: parameter.name,
            value: parameter.value,
            unit: parameter.unit,
        }));

        const context = {
            CertificateNumberStr: certificate.numberStr,
            CertificateDate: formatDate(certificate.createdAt),
            ProductName: certificate.batch.product.name,
            BatchCreatedAt: formatDateTime(certificate.batch.createdAt),
            Outcome: `${certificate.batch.nettoWeight}`,
            SapmlesList: samplesList,
            SamplesList: samplesList,
            StorageCondition: certificate.batch.storageCondition.name,
            ExpiresTo: formatDateTime(expiresTo),
            ProcessMap: certificate.batch.processMap?.name ?? '',
            BatchNumber: certificate.batch.numberStr,
            caloriesKcal: formatDecimalLike(
                certificate.batch.product.caloriesKcal
            ),
            fatGrams: formatDecimalLike(certificate.batch.product.fatGrams),
            proteinGrams: formatDecimalLike(
                certificate.batch.product.proteinGrams
            ),
            carbohydratesGrams: formatDecimalLike(
                certificate.batch.product.carbohydratesGrams
            ),
            sugarsGrams: formatDecimalLike(
                certificate.batch.product.sugarsGrams
            ),
            fiberGrams: formatDecimalLike(certificate.batch.product.fiberGrams),
            saltGrams: formatDecimalLike(certificate.batch.product.saltGrams),
            ingredients,
            HasProcessMapParameters: processMapParameters.length > 0,
            ProcessMapParameters: processMapParameters,
            extraCertificateData: certificate.extraCertificateData,
        };

        const outputMeta = CertificateService.getCertificateOutputMeta();
        const fileBuffer =
            CertificateService.renderCertificateDocument(context);

        if (
            fileBuffer.length < 4 ||
            fileBuffer[0] !== 0x50 ||
            fileBuffer[1] !== 0x4b
        ) {
            throw new Error(
                'Generated file is not a valid OpenXML zip package'
            );
        }

        const batchNumberForFile = sanitizeFileNameSegment(
            certificate.batch.numberStr
        );

        return {
            fileName: `cert-${batchNumberForFile}.${outputMeta.extension}`,
            mimeType: outputMeta.mimeType,
            fileBuffer,
        };
    }
    static renderCertificateDocument(
        templateData: Record<string, unknown>
    ): Buffer {
        const templatePath = CertificateService.getCertificateTemplatePath();
        if (!fs.existsSync(templatePath)) {
            throw new Error(
                `Certificate template not found at ${templatePath}. Set CERTIFICATE_TEMPLATE_PATH.`
            );
        }

        const fileBuffer = fs.readFileSync(templatePath);
        const zip = new PizZip(fileBuffer);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        doc.render(templateData);
        const renderedZip = doc.getZip();

        const scalarValues = Object.fromEntries(
            Object.entries(templateData).filter(([, value]) => {
                const valueType = typeof value;
                return (
                    value === null ||
                    value === undefined ||
                    valueType === 'string' ||
                    valueType === 'number' ||
                    valueType === 'boolean'
                );
            })
        );

        // Support Word Content Controls (w:sdt) tagged fields used in this template.
        for (const fileName of Object.keys(renderedZip.files)) {
            if (!fileName.startsWith('word/') || !fileName.endsWith('.xml')) {
                continue;
            }
            const entry = renderedZip.file(fileName);
            if (!entry) {
                continue;
            }

            const xmlContent = entry.asText();
            const updatedXmlContent =
                CertificateService.fillTaggedContentControls(
                    xmlContent,
                    scalarValues
                );
            if (updatedXmlContent !== xmlContent) {
                renderedZip.file(fileName, updatedXmlContent);
            }
        }

        const uint8 = renderedZip.generate({
            type: 'uint8array',
            compression: 'DEFLATE',
        }) as Uint8Array;
        return Buffer.from(uint8);
    }
}
