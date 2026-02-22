import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVoter extends Document {
    name: string;
    dateOfBirth: Date;
    serialNumber: number;
    voterNumber: number;
    village: string;
    motherName: string;
    fatherOrHusbandName: string;
    pollingCenter: string;
    addedBy: 'system' | 'self';
    createdAt?: Date;
}

const VoterSchema: Schema<IVoter> = new Schema(
    {
        voterNumber: {
            type: Number,
            required: true,
            trim: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        dateOfBirth: {
            type: Date,
            required: true,
        },
        serialNumber: {
            type: Number,
            required: true,
        },
        village: {
            type: String,
            required: true,
            trim: true,
        },
        motherName: {
            type: String,
            default: 'Unknown',
            trim: true,
        },
        fatherOrHusbandName: {
            type: String,
            default: 'Unknown',
            trim: true,
        },
        pollingCenter: {
            type: String,
            required: true,
            trim: true,
        },
        addedBy: {
            type: String,
            enum: ['system', 'self'],
            default: 'system',
        },
    },
    {
        timestamps: true,
    },
);

VoterSchema.index({ village: 1 });
VoterSchema.index({ serialNumber: 1 });

const VoterData: Model<IVoter> =
    mongoose.models.VoterData || mongoose.model<IVoter>('VoterData', VoterSchema);

export default VoterData;
