import * as yup from 'yup';

export const createCardSchema = yup.object({
  title: yup.string().trim().required('Title is required.'),
  moneyAmount: yup
    .string()
    .trim()
    .required('Money amount is required.')
    .test('is-finite-number', 'Money amount must be a valid number.', val =>
      val ? Number.isFinite(Number(val)) : false,
    ),
});

export type CreateCardFormValues = yup.InferType<typeof createCardSchema>;
