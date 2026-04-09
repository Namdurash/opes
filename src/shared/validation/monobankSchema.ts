import * as yup from 'yup';

export const connectMonobankSchema = yup.object({
  token: yup
    .string()
    .trim()
    .required('Please enter your Monobank personal token.'),
});

export type ConnectMonobankFormValues = yup.InferType<typeof connectMonobankSchema>;
