package pe.edu.utec.vetcare.service;

import pe.edu.utec.vetcare.dto.request.CreateCitaRequest;
import pe.edu.utec.vetcare.dto.request.UpdateCitaRequest;
import pe.edu.utec.vetcare.dto.response.CitaResponse;

import java.util.List;

public interface CitaService {

    List<CitaResponse> getAll();

    CitaResponse getById(Integer id);

    CitaResponse create(CreateCitaRequest request);

    CitaResponse update(Integer id, UpdateCitaRequest request);

    void delete(Integer id);

    CitaResponse confirm(Integer id);

    CitaResponse cancel(Integer id);

    CitaResponse attend(Integer id);
}