from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet


class CompanyScopedReadOnlyViewSet(ReadOnlyModelViewSet):

    def get_queryset(self):
        qs = super().get_queryset()
        company = getattr(self.request, "company", None)

        if hasattr(qs.model, "company") and company:
            return qs.filter(company=company)

        return qs


class CompanyScopedViewSet(ModelViewSet):

    def get_queryset(self):
        qs = super().get_queryset()
        company = getattr(self.request, "company", None)

        if hasattr(qs.model, "company") and company:
            return qs.filter(company=company)

        return qs

    def perform_create(self, serializer):
        company = getattr(self.request, "company", None)
        model = getattr(serializer.Meta, "model", None)

        if model and hasattr(model, "company") and company:
            serializer.save(company=company)
        else:
            serializer.save()

    def perform_update(self, serializer):
        company = getattr(self.request, "company", None)
        model = getattr(serializer.Meta, "model", None)

        if model and hasattr(model, "company") and company:
            serializer.save(company=company)
        else:
            serializer.save()
