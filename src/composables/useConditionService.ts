// src/composables/useConditionService.ts
import { ref, computed } from 'vue';
import { FieldType, OperatorType, JoinOperatorType } from '@/types/rule-builder.ts';

export function useConditionService() {
  // Fields
  const fields = ref([
    {
      label: 'URI Path',
      value: FieldType.URI_PATH,
      description: 'The request URI path',
      meta: {
        placeholder: 'ex: /uri/path',
        valueDescription: 'Starts with /, ex: /api/v1',
      }
    },
    {
      label: 'Method',
      value: FieldType.METHOD,
      description: 'HTTP method',
      meta: {
        type: 'select',
        placeholder: 'Select HTTP method',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' },
          { label: 'PATCH', value: 'PATCH' },
          { label: 'OPTIONS', value: 'OPTIONS' },
        ]
      }
    },
    {
      label: 'Host',
      value: FieldType.HOST,
      description: 'The host header',
      meta: {
        placeholder: 'Enter host',
        type: 'text',
        valueDescription: 'ex: example.com',
      }
    },
    {
      label: 'User Agent',
      value: FieldType.USER_AGENT,
      description: 'User agent header',
    },
    {
      label: 'Country',
      value: FieldType.COUNTRY,
      description: 'Geo location country',
      meta: {
        type: 'select',
        options: [
          { label: 'United States', value: 'US' },
          { label: 'China', value: 'CN' },
          { label: 'United Kingdom', value: 'GB' },
          // Add more countries as needed
        ]
      }
    },
    {
      label: 'Status Code',
      value: FieldType.STATUS_CODE,
      description: 'Response status code',
      meta: {
        placeholder: 'Enter status code',
        type: 'number',
        min: 100,
        max: 599,
        step: 1,
        valueDescription: 'Must be a number between 100 and 599, ex: 200, 404',
      }
    }
  ]);

  // Operators
  const operators = ref([
    {
      label: 'Equals',
      value: OperatorType.EQUALS,
      description: 'Exact match'
    },
    {
      label: 'Not Equals',
      value: OperatorType.NOT_EQUALS,
      description: 'Not match'
    },
    {
      label: 'Contains',
      value: OperatorType.CONTAINS,
      description: 'Substring match'
    },
    {
      label: 'Starts With',
      value: OperatorType.STARTS_WITH,
      description: 'Starts with prefix'
    },
    {
      label: 'Ends With',
      value: OperatorType.ENDS_WITH,
      description: 'Ends with suffix'
    }
  ]);

  // Join operators
  const joinOperators = ref([
    {
      label: 'AND',
      value: JoinOperatorType.AND,
      description: 'Both conditions must be true'
    },
    {
      label: 'OR',
      value: JoinOperatorType.OR,
      description: 'Either condition can be true'
    }
  ]);

  // Validate a field value based on field type
  function validateField(fieldType: FieldType, value: string): string | undefined {
    if (!value) {
      return 'This field is required';
    }

    const field = fields.value.find(f => f.value === fieldType);
    if (!field) return undefined;

    // Field-specific validation
    switch(fieldType) {
      case FieldType.URI_PATH:
        // URI path must start with /
        if (!value.startsWith('/')) {
          return 'Path must start with /';
        }

        // Validate URI path format
        const pathRegex = /^[a-zA-Z0-9/.\-_~%:;?&=#@]+$/;
        if (!pathRegex.test(value)) {
          return 'Path contains invalid characters';
        }
        break;

      case FieldType.STATUS_CODE:
        // Status code must be a number between 100 and 599
        const statusCode = parseInt(value, 10);
        if (isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
          return 'Status code must be between 100 and 599';
        }
        break;
    }

    return undefined;
  }

  return {
    fields,
    operators,
    joinOperators,
    validateField
  };
}
