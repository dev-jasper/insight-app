class DomainError(Exception):
    pass


class ValidationError(DomainError):
    def __init__(self, details: dict[str, list[str]]):
        super().__init__("Validation error")
        self.details = details