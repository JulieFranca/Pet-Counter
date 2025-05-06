interface PasswordRequirementsProps {
  password: string;
  confirmPassword: string;
}

interface Requirement {
  label: string;
  isValid: boolean;
}

export default function PasswordRequirements({ password, confirmPassword }: PasswordRequirementsProps) {
  const requirements: Requirement[] = [
    {
      label: 'Letra maiúscula',
      isValid: /[A-Z]/.test(password)
    },
    {
      label: 'Letra minúscula',
      isValid: /[a-z]/.test(password)
    },
    {
      label: 'Número',
      isValid: /[0-9]/.test(password)
    },
    {
      label: 'Caractere especial',
      isValid: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    },
    {
      label: 'Mínimo de 8 caracteres',
      isValid: password.length >= 8
    },
    {
      label: 'Senhas coincidem',
      isValid: password === confirmPassword && password !== ''
    }
  ];

  return (
    <div className="mt-2 space-y-2">
      {requirements.map((requirement, index) => (
        <div key={index} className="flex items-center text-sm">
          <span className={`mr-2 ${requirement.isValid ? 'text-green-500' : 'text-gray-400'}`}>
            {requirement.isValid ? '✓' : '○'}
          </span>
          <span className={requirement.isValid ? 'text-green-500' : 'text-gray-600'}>
            {requirement.label}
          </span>
        </div>
      ))}
    </div>
  );
} 