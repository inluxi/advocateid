{{- define "advocateid.name" -}}{{ .Release.Name }}{{- end -}}
{{- define "advocateid.env" -}}
{{- range $k, $v := .Values.env }}
- name: {{ $k }}
  value: {{ $v | quote }}
{{- end }}
{{- range $k := list "DATABASE_URL" "APP_SECRET" "MSG91_AUTH_KEY" "MSG91_TEMPLATE_ID" "JOB_TOKEN" "ADMIN_MOBILES" }}
- name: {{ $k }}
  valueFrom:
    secretKeyRef:
      name: {{ $.Values.secrets.app }}
      key: {{ $k }}
      optional: {{ if or (eq $k "ADMIN_MOBILES") (eq $k "JOB_TOKEN") }}true{{ else }}false{{ end }}
{{- end }}
- name: FIREBASE_SERVICE_ACCOUNT
  valueFrom:
    secretKeyRef:
      name: {{ .Values.secrets.firebase }}
      key: FIREBASE_SERVICE_ACCOUNT
      optional: true
- name: NODE_ENV
  value: production
{{- end -}}
