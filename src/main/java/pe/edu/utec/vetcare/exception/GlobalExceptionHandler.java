package pe.edu.utec.vetcare.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.security.access.AccessDeniedException;

import java.util.Map;
import java.util.TreeMap;
import java.util.LinkedHashMap;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> campos = new TreeMap<>();
        ex.getBindingResult().getFieldErrors().forEach(fieldError ->
                campos.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage() == null
                        ? "Valor inválido" : fieldError.getDefaultMessage()));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("error", "Error de validación");
        response.put("campos", campos);
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Acceso denegado"));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleResourceNotFound(
            ResourceNotFoundException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(
            BadRequestException ex) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(CitaHorarioOcupadoException.class)
    public ResponseEntity<Map<String, String>> handleCitaHorarioOcupado(
            CitaHorarioOcupadoException ex) {

        Map<String, String> response = Map.of("error", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(response);
    }

    @ExceptionHandler(EstadoCitaInvalidoException.class)
    public ResponseEntity<Map<String, String>> handleEstadoCitaInvalido(
            EstadoCitaInvalidoException ex) {

        Map<String, String> response = Map.of("error", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(response);
    }

    @ExceptionHandler(AtencionNoEncontradaException.class)
    public ResponseEntity<Map<String, String>> handleAtencionNoEncontrada(
            AtencionNoEncontradaException ex
    ) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", ex.getMessage()));
    }
}