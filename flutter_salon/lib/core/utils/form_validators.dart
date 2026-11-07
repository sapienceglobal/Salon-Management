/// Centralized form validators with human-readable error messages.
///
/// Usage: Pass these as the `validator` parameter to any TextFormField.
/// Example: `validator: FormValidators.required('Full Name')`
class FormValidators {
  FormValidators._();

  // ── Required ──────────────────────────────────────────────────────
  static String? Function(String?) required(String fieldName) {
    return (value) {
      if (value == null || value.trim().isEmpty) {
        return 'Please enter $fieldName';
      }
      return null;
    };
  }

  // ── Name (only letters and spaces, min 2 chars) ───────────────────
  static String? Function(String?) name(
    String fieldName, {
    bool isRequired = true,
  }) {
    return (value) {
      if (value == null || value.trim().isEmpty) {
        return isRequired ? 'Please enter $fieldName' : null;
      }
      if (value.trim().length < 2) {
        return '$fieldName must be at least 2 characters';
      }
      if (!RegExp(r"^[a-zA-Z\s'.]+$").hasMatch(value.trim())) {
        return '$fieldName can only contain letters';
      }
      return null;
    };
  }

  // ── Phone (Indian 10-digit) ───────────────────────────────────────
  static String? Function(String?) phone({bool isRequired = true}) {
    return (value) {
      if (value == null || value.trim().isEmpty) {
        return isRequired ? 'Please enter mobile number' : null;
      }
      final digits = value.replaceAll(RegExp(r'[^0-9]'), '');
      if (digits.length < 10) {
        return 'Mobile number must be at least 10 digits';
      }
      if (digits.length > 15) {
        return 'Mobile number is too long';
      }
      return null;
    };
  }

  // ── Email ─────────────────────────────────────────────────────────
  static String? Function(String?) email({bool isRequired = false}) {
    return (value) {
      if (value == null || value.trim().isEmpty) {
        return isRequired ? 'Please enter email address' : null;
      }
      final emailRegex = RegExp(
        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
      );
      if (!emailRegex.hasMatch(value.trim())) {
        return 'Please enter a valid email (e.g. name@example.com)';
      }
      return null;
    };
  }

  // ── Price / Amount (positive number) ──────────────────────────────
  static String? Function(String?) price(
    String fieldName, {
    bool isRequired = true,
  }) {
    return (value) {
      if (value == null || value.trim().isEmpty) {
        return isRequired ? 'Please enter $fieldName' : null;
      }
      final number = double.tryParse(value.trim());
      if (number == null) {
        return '$fieldName must be a valid number';
      }
      if (number < 0) {
        return '$fieldName cannot be negative';
      }
      return null;
    };
  }

  // ── Quantity (positive integer) ───────────────────────────────────
  static String? Function(String?) quantity(
    String fieldName, {
    bool isRequired = true,
    bool allowZero = true,
  }) {
    return (value) {
      if (value == null || value.trim().isEmpty) {
        return isRequired ? 'Please enter $fieldName' : null;
      }
      final number = int.tryParse(value.trim());
      if (number == null) {
        return '$fieldName must be a whole number';
      }
      if (!allowZero && number <= 0) {
        return '$fieldName must be greater than 0';
      }
      if (number < 0) {
        return '$fieldName cannot be negative';
      }
      return null;
    };
  }

  // ── Salary / Number (positive, optional) ──────────────────────────
  static String? Function(String?) salary({bool isRequired = false}) {
    return (value) {
      if (value == null || value.trim().isEmpty) {
        return isRequired ? 'Please enter salary amount' : null;
      }
      final number = double.tryParse(value.trim());
      if (number == null) {
        return 'Salary must be a valid number';
      }
      if (number < 0) {
        return 'Salary cannot be negative';
      }
      return null;
    };
  }

  // ── Duration (positive integer, minutes) ──────────────────────────
  static String? Function(String?) duration({bool isRequired = true}) {
    return (value) {
      if (value == null || value.trim().isEmpty) {
        return isRequired ? 'Please enter duration in minutes' : null;
      }
      final number = int.tryParse(value.trim());
      if (number == null) {
        return 'Duration must be a whole number';
      }
      if (number <= 0) {
        return 'Duration must be greater than 0 minutes';
      }
      if (number > 720) {
        return 'Duration cannot exceed 12 hours (720 minutes)';
      }
      return null;
    };
  }

  // ── GST Number (Indian format) ────────────────────────────────────
  static String? Function(String?) gst({bool isRequired = false}) {
    return (value) {
      if (value == null || value.trim().isEmpty) {
        return isRequired ? 'Please enter GST number' : null;
      }
      final gstRegex = RegExp(
        r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
      );
      if (!gstRegex.hasMatch(value.trim().toUpperCase())) {
        return 'Please enter a valid GST number (e.g. 22AAAAA0000A1Z5)';
      }
      return null;
    };
  }

  // ── Min length ────────────────────────────────────────────────────
  static String? Function(String?) minLength(
    String fieldName,
    int minLen, {
    bool isRequired = true,
  }) {
    return (value) {
      if (value == null || value.trim().isEmpty) {
        return isRequired ? 'Please enter $fieldName' : null;
      }
      if (value.trim().length < minLen) {
        return '$fieldName must be at least $minLen characters';
      }
      return null;
    };
  }

  // ── Max length ────────────────────────────────────────────────────
  static String? Function(String?) maxLength(
    String fieldName,
    int maxLen, {
    bool isRequired = false,
  }) {
    return (value) {
      if (value == null || value.trim().isEmpty) {
        return isRequired ? 'Please enter $fieldName' : null;
      }
      if (value.trim().length > maxLen) {
        return '$fieldName must be less than $maxLen characters';
      }
      return null;
    };
  }

  // ── Compose: chain multiple validators ────────────────────────────
  static String? Function(String?) compose(
    List<String? Function(String?)> validators,
  ) {
    return (value) {
      for (final validator in validators) {
        final result = validator(value);
        if (result != null) return result;
      }
      return null;
    };
  }
}
