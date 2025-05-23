// src/composables/useConditionService.ts
import { ref, computed } from 'vue';
import { FieldType, OperatorType, JoinOperatorType } from '@/types/rule-builder.ts';

// Centralized default values and display constants
export const DEFAULTS = {
  FIELD: FieldType.URI_PATH,
  OPERATOR: OperatorType.EQUALS,
  VALUE: '',
  EMPTY_VALUE_DISPLAY: '""',
  EMPTY_FUNCTION_DISPLAY: '__',
  EMPTY_FUNCTION_ARG_DISPLAY: '""'
} as const;

export function useConditionService() {
  // Fields with enhanced metadata
  const fields = ref([
    {
      label: 'URI Path',
      value: FieldType.URI_PATH,
      description: 'The request URI path',
      meta: {
        placeholder: '/api/users',
        valueDescription: 'URL path starting with /, e.g., /api/v1/users, /blog/posts',
        type: 'text',
        pattern: '^/',
        examples: ['/api/v1/users', '/blog/posts', '/admin/dashboard']
      }
    },
    {
      label: 'Method',
      value: FieldType.METHOD,
      description: 'HTTP method',
      meta: {
        type: 'select',
        placeholder: 'GET',
        valueDescription: 'HTTP method like GET, POST, PUT, DELETE',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' },
          { label: 'PATCH', value: 'PATCH' },
          { label: 'OPTIONS', value: 'OPTIONS' },
        ],
        examples: ['GET', 'POST', 'PUT']
      }
    },
    {
      label: 'Host',
      value: FieldType.HOST,
      description: 'The host header',
      meta: {
        placeholder: 'api.example.com',
        type: 'text',
        valueDescription: 'Domain name, e.g., api.example.com, www.site.org',
        pattern: '^[a-zA-Z0-9.-]+$',
        examples: ['api.example.com', 'www.mysite.org', 'localhost:3000']
      }
    },
    {
      label: 'User Agent',
      value: FieldType.USER_AGENT,
      description: 'User agent header',
      meta: {
        placeholder: 'Chrome',
        type: 'text',
        valueDescription: 'Browser or client identifier, e.g., "Chrome", "mobile"',
        examples: ['Chrome', 'Firefox', 'mobile', 'bot']
      }
    },
    {
      label: 'Country',
      value: FieldType.COUNTRY,
      description: 'Geo location country',
      meta: {
        type: 'select',
        placeholder: 'US',
        valueDescription: 'Two-letter country code, e.g., US, GB, CA, DE',
        options: [
          { label: 'United States', value: 'US' },
          { label: 'United Kingdom', value: 'GB' },
          { label: 'Canada', value: 'CA' },
          { label: 'Germany', value: 'DE' },
          { label: 'France', value: 'FR' },
          { label: 'China', value: 'CN' },
          { label: 'Japan', value: 'JP' },
          { label: 'Australia', value: 'AU' }
        ],
        examples: ['US', 'GB', 'CA']
      }
    },
    {
      label: 'Status Code',
      value: FieldType.STATUS_CODE,
      description: 'Response status code',
      meta: {
        placeholder: '200',
        type: 'number',
        min: 100,
        max: 599,
        step: 1,
        valueDescription: 'HTTP status code, e.g., 200 (OK), 404 (Not Found), 500 (Error)',
        examples: ['200', '404', '500', '301']
      }
    }
  ]);

  // Operators with enhanced descriptions
  const operators = ref([
    {
      label: 'Equals',
      value: OperatorType.EQUALS,
      description: 'Exact match - value must be identical'
    },
    {
      label: 'Not Equals',
      value: OperatorType.NOT_EQUALS,
      description: 'Must not match - value must be different'
    },
    {
      label: 'Contains',
      value: OperatorType.CONTAINS,
      description: 'Partial match - value contains the text'
    },
    {
      label: 'Starts With',
      value: OperatorType.STARTS_WITH,
      description: 'Begins with - value starts with the text'
    },
    {
      label: 'Ends With',
      value: OperatorType.ENDS_WITH,
      description: 'Ends with - value ends with the text'
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

  // Enhanced validation function
  function validateField(fieldType: FieldType, value: string): string | undefined {
    if (!value) {
      return 'This field is required';
    }

    const field = fields.value.find(f => f.value === fieldType);
    if (!field) return undefined;

    // Field-specific validation with better error messages
    switch(fieldType) {
      case FieldType.URI_PATH:
        // URI path must start with /
        if (!value.startsWith('/')) {
          return 'Path must start with / (e.g., /api/users)';
        }

        // Validate URI path format
        const pathRegex = /^[a-zA-Z0-9/.\-_~%:;?&=#@]+$/;
        if (!pathRegex.test(value)) {
          return 'Path contains invalid characters. Use letters, numbers, /, -, _, and %';
        }

        // Check for common mistakes
        if (value.includes('//')) {
          return 'Path should not contain double slashes (//)';
        }
        break;

      case FieldType.STATUS_CODE:
        // Status code must be a number between 100 and 599
        const statusCode = parseInt(value, 10);
        if (isNaN(statusCode)) {
          return 'Status code must be a number (e.g., 200, 404)';
        }
        if (statusCode < 100 || statusCode > 599) {
          return 'Status code must be between 100 and 599';
        }
        break;

      case FieldType.HOST:
        // Basic hostname validation
        const hostRegex = /^[a-zA-Z0-9.-]+(:[0-9]+)?$/;
        if (!hostRegex.test(value)) {
          return 'Invalid hostname format. Use domain.com or domain.com:port';
        }

        // Check for common mistakes
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return 'Host should not include protocol (http/https)';
        }
        break;

      case FieldType.COUNTRY:
        // Country code should be 2 uppercase letters
        const countryRegex = /^[A-Z]{2}$/;
        if (!countryRegex.test(value)) {
          return 'Country code must be 2 uppercase letters (e.g., US, GB)';
        }
        break;

      case FieldType.METHOD:
        // Validate HTTP method
        const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
        if (!validMethods.includes(value.toUpperCase())) {
          return `Invalid HTTP method. Use: ${validMethods.join(', ')}`;
        }
        break;
    }

    return undefined;
  }

  // Get field configuration by type
  function getFieldConfig(fieldType: FieldType) {
    return fields.value.find(f => f.value === fieldType);
  }

  // Get examples for a field
  function getFieldExamples(fieldType: FieldType): string[] {
    const field = getFieldConfig(fieldType);
    return field?.meta?.examples || [];
  }

  return {
    fields,
    operators,
    joinOperators,
    validateField,
    getFieldConfig,
    getFieldExamples,
    DEFAULTS
  };
}